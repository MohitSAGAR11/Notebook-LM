/**
 * rag.js
 *
 * Full RAG pipeline orchestrator.
 *
 * INGESTION: extract → chunk → embed → store
 * RETRIEVAL: embed query → similarity search → assemble context
 * GENERATION: grounded LLM answer from retrieved context only
 */

import fs from "fs";
import OpenAI from "openai";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chunkDocument } from "./chunker.js";
import { embedChunks, embedQuery } from "./embedder.js";
import { upsertVectors, queryVectors } from "./vectorStore.js";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const EMBED_BATCH_SIZE = 50;
const READ_STREAM_CHUNK = 64 * 1024; // 64KB

// ─── INGESTION ────────────────────────────────────────────────────────────────

/**
 * Read a file via stream into a single Buffer (lower peak RSS than readFileSync).
 * @param {string} filePath
 * @returns {Promise<Buffer>}
 */
function streamToBuffer(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = fs.createReadStream(filePath, {
      highWaterMark: READ_STREAM_CHUNK,
    });
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/**
 * Stream a plain-text file and return its full contents as a string.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function streamTextFile(filePath) {
  return new Promise((resolve, reject) => {
    const parts = [];
    const stream = fs.createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: READ_STREAM_CHUNK,
    });
    stream.on("data", (chunk) => parts.push(chunk));
    stream.on("end", () => resolve(parts.join("")));
    stream.on("error", reject);
  });
}

/**
 * Extract text from a PDF using pdfjs-dist (ESM-native, no CJS compat issues).
 * Iterates page by page to keep memory flat on large files.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(filePath) {
  const buffer = await streamToBuffer(filePath);
  const uint8Array = new Uint8Array(buffer);

  const doc = await getDocument({
    data: uint8Array,
    // Suppress the "Setting up fake worker" warning in Node
    disableWorker: true,
  }).promise;

  console.log(`[RAG] PDF has ${doc.numPages} pages`);

  const pageTexts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}

/**
 * Extract text from a PDF or plain text file.
 * @param {string} filePath
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
async function extractText(filePath, mimeType) {
  if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
    return extractTextFromPDF(filePath);
  }
  return streamTextFile(filePath);
}

/**
 * Ingest a document: extract → chunk → embed (batched) → store (batched).
 *
 * @param {object} params
 * @param {string} params.filePath - path to uploaded file
 * @param {string} params.mimeType - file mime type
 * @param {string} params.docId    - unique namespace for this document
 * @param {string} params.fileName - original filename
 * @returns {Promise<{ docId: string, chunkCount: number }>}
 */
export async function ingestDocument({ filePath, mimeType, docId, fileName }) {
  console.log(`[RAG] Ingesting: ${fileName}`);

  // 1. Extract text
  const rawText = await extractText(filePath, mimeType);
  if (!rawText || rawText.trim().length < 50) {
    throw new Error("Could not extract meaningful text from the document.");
  }
  console.log(`[RAG] Extracted ${rawText.length} characters`);

  // 2. Chunk
  const chunks = chunkDocument(rawText, fileName);
  console.log(`[RAG] Created ${chunks.length} chunks`);

  if (chunks.length === 0) {
    throw new Error("Document produced zero chunks after processing.");
  }

  // 3 & 4. Embed + Store in batches to avoid memory spikes and API timeouts
  let totalEmbedded = 0;
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    const embeddings = await embedChunks(texts);
    await upsertVectors(docId, batch, embeddings, i); // pass i as startIndex offset

    totalEmbedded += batch.length;
    console.log(
      `[RAG] Embedded + stored ${totalEmbedded}/${chunks.length} chunks`,
    );
  }

  return { docId, chunkCount: chunks.length };
}

// ─── RETRIEVAL + GENERATION ───────────────────────────────────────────────────

/**
 * Answer a user question grounded in the document.
 *
 * @param {object} params
 * @param {string} params.docId    - Pinecone namespace for the document
 * @param {string} params.question - user's natural language question
 * @param {Array}  params.history  - prior messages [{ role, content }]
 * @returns {Promise<{ answer: string, sources: Array }>}
 */
export async function answerQuestion({ docId, question, history = [] }) {
  console.log(`[RAG] Answering: "${question}"`);

  // 1. Embed the query
  const queryEmbedding = await embedQuery(question);

  // 2. Retrieve top-K relevant chunks
  const retrieved = await queryVectors(docId, queryEmbedding, 5);

  if (retrieved.length === 0) {
    return {
      answer:
        "I couldn't find any relevant information in the document to answer your question.",
      sources: [],
    };
  }

  // 3. Build context string
  const context = retrieved
    .map(
      (r, i) =>
        `[Chunk ${i + 1} | relevance: ${(r.score * 100).toFixed(1)}%]\n${r.text}`,
    )
    .join("\n\n---\n\n");

  // 4. Build conversation history for multi-turn
  const conversationHistory = history.slice(-6).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 5. Generate grounded answer
  const systemPrompt = `You are a precise document analysis assistant. Your ONLY job is to answer questions based on the document excerpts provided in the context below.

STRICT RULES:
- Answer ONLY using information present in the provided context chunks.
- If the context does not contain enough information to answer, say: "The document doesn't contain enough information to answer this question."
- Never use your general knowledge or training data to fill gaps.
- Write in clean, readable prose. Use markdown: **bold** for key terms, bullet points for lists, code blocks for code.
- Do NOT reference chunks, sources, or internal metadata in your answer. Just answer naturally.
- Be concise but complete. Use bullet points for lists.
- If asked for code, examples, or steps — reproduce them exactly as they appear in the document.

CONTEXT FROM DOCUMENT:
${context}`;

  const response = await openai.chat.completions.create({
    model: "openai/gpt-oss-120b:free",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: question },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  });

  const answer = response.choices[0].message.content;

  // Return answer + source metadata for the UI to display
  const sources = retrieved.map((r) => ({
    text: r.text.slice(0, 200) + (r.text.length > 200 ? "…" : ""),
    score: r.score,
    chunkIndex: r.metadata.chunkIndex,
    source: r.metadata.source,
  }));

  return { answer, sources };
}
