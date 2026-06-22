
/**
 * embedder.js
 *
 * Uses @langchain/community HuggingFaceInferenceEmbeddings — same as the
 * working reference implementation. It handles the correct API endpoint,
 * cold-start waiting, and response parsing internally.
 *
 * Install: npm install @langchain/community @langchain/core
 *
 * .env key name: HUGGINGFACEHUB_API_KEY  (note: NOT HF_API_KEY)
 * Get free token: https://huggingface.co/settings/tokens
 */

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    const apiKey = process.env.HUGGINGFACEHUB_API_KEY?.trim();
    if (!apiKey) throw new Error("HUGGINGFACEHUB_API_KEY is missing from .env");

    embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey,
      model: EMBEDDING_MODEL,
    });
  }
  return embeddings;
}

/**
 * Embed a single query string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedQuery(text) {
  const emb = getEmbeddings();
  return emb.embedQuery(text.replace(/\n/g, " ").trim());
}

/**
 * Embed an array of chunk texts. LangChain handles batching internally.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedChunks(texts) {
  const emb = getEmbeddings();
  const clean = texts.map((t) => t.replace(/\n/g, " ").trim());

  console.log(`[Embedder] Embedding ${clean.length} chunks via HuggingFace...`);
  const vectors = await emb.embedDocuments(clean);
  console.log(`[Embedder] Done — ${vectors.length} vectors, dim=${vectors[0]?.length ?? "?"}`);

  return vectors;
}