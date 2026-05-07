// /**
//  * embedder.js
//  *
//  * Handles generating embeddings for text chunks using OpenAI's
//  * text-embedding-3-small model (1024 dimensions).
//  *
//  * Why text-embedding-3-small?
//  * - Best cost/quality tradeoff for RAG applications
//  * - Strong multilingual support
//  * - 1024 dimensions — rich enough for accurate similarity search
//  *
//  * Batching: OpenAI recommends batches of up to 100 inputs per request.
//  */

// import OpenAI from "openai";

// const EMBEDDING_MODEL = "text-embedding-3-small";
// const BATCH_SIZE = 100;

// let client = null;

// function getClient() {
//   if (!client) {
//     client = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//   }
//   return client;
// }
// /**
//  * Embed a single string query.
//  * @param {string} text
//  * @returns {Promise<number[]>} embedding vector
//  */
// export async function embedQuery(text) {
//   const openai = getClient();
//   const response = await openai.embeddings.create({
//     model: EMBEDDING_MODEL,
//     input: text.replace(/\n/g, " "),
//   });
//   return response.data[0].embedding;
// }

// /**
//  * Embed an array of text chunks in batches.
//  * @param {string[]} texts
//  * @returns {Promise<number[][]>} array of embedding vectors
//  */
// export async function embedChunks(texts) {
//   const openai = getClient();
//   const allEmbeddings = [];

//   for (let i = 0; i < texts.length; i += BATCH_SIZE) {
//     const batch = texts
//       .slice(i, i + BATCH_SIZE)
//       .map((t) => t.replace(/\n/g, " "));

//     const response = await openai.embeddings.create({
//       model: EMBEDDING_MODEL,
//       input: batch,
//     });

//     console.log("[Embedder] Raw response:", JSON.stringify(response, null, 2));

//     if (!response.data || !Array.isArray(response.data)) {
//       console.error(
//         "[Embedder] Unexpected response shape:",
//         JSON.stringify(response),
//       );
//       throw new Error(`Embedding API returned unexpected shape. Check logs.`);
//     }

//     // OpenAI returns embeddings in the same order as input
//     const embeddings = response.data.map((d) => d.embedding);
//     allEmbeddings.push(...embeddings);

//     // Small delay between batches to be safe with rate limits
//     if (i + BATCH_SIZE < texts.length) {
//       await new Promise((r) => setTimeout(r, 200));
//     }
//   }

//   return allEmbeddings;
// }
/**
 * embedder.js
 *
 * Embeddings via Hugging Face Inference API — COMPLETELY FREE.
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2
 *   - 384 dimensions
 *   - MTEB-proven quality for semantic similarity / RAG retrieval
 *   - Supported natively by HF Inference API (no Docker / TEI needed)
 *
 * API used: https://api-inference.huggingface.co/models/<model-id>
 *   - POST with { inputs: string | string[] }
 *   - Returns: number[] for single input, number[][] for batch
 *   - Pass options.wait_for_model: true to handle cold starts (503)
 *
 * Get your FREE token at: https://huggingface.co/settings/tokens
 * → "New token" → Type: Read → copy the hf_xxx token
 */

// const MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2";
// const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL_ID}`;

// // HF free tier: batches of 16 are safe and fast.
// // The model itself supports larger batches but free inference API throttles.
// const BATCH_SIZE = 16;

// // How long to wait between batches (ms) — avoids 429 on free tier
// const BATCH_DELAY_MS = 600;

// // Max retries when model is loading (503 / "currently loading")
// const MAX_RETRIES = 5;
// const RETRY_DELAY_MS = 3000;

// /**
//  * Core HF API call. Handles cold-start retries (503 "Model is currently loading").
//  * @param {string[]} inputs - array of strings (batch)
//  * @returns {Promise<number[][]>} - array of embedding vectors
//  */
// async function hfEmbed(inputs) {
//   let attempt = 0;

//   while (attempt < MAX_RETRIES) {
//     const response = await fetch(HF_API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.HF_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         inputs,
//         options: {
//           wait_for_model: true, // tells HF to block until model is warm
//           use_cache: false, // don't cache — we need all unique vectors
//         },
//       }),
//     });

//     // 503 = model still loading despite wait_for_model — retry manually
//     if (response.status === 503) {
//       attempt++;
//       console.log(
//         `[Embedder] Model loading, retry ${attempt}/${MAX_RETRIES}...`,
//       );
//       await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
//       continue;
//     }

//     if (!response.ok) {
//       const errText = await response.text();
//       throw new Error(`HuggingFace API ${response.status}: ${errText}`);
//     }

//     const data = await response.json();

//     // HF feature-extraction returns:
//     //   - number[][] when inputs is an array  ← what we want
//     //   - number[]   when inputs is a string  ← shouldn't happen here
//     // Some models return number[][][] (token-level) — we mean-pool if so.
//     if (!Array.isArray(data)) {
//       throw new Error(
//         "Unexpected HF response: " + JSON.stringify(data).slice(0, 200),
//       );
//     }

//     // If token-level embeddings returned (3D), mean-pool to sentence level
//     if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
//       return data.map((tokenEmbeds) => meanPool(tokenEmbeds));
//     }

//     // Standard case: 2D array — one vector per input
//     return data;
//   }

//   throw new Error("HuggingFace model failed to load after max retries.");
// }

// /**
//  * Mean-pool token embeddings → single sentence embedding.
//  * @param {number[][]} tokenEmbeds - shape [seq_len, hidden_dim]
//  * @returns {number[]} - shape [hidden_dim]
//  */
// function meanPool(tokenEmbeds) {
//   const dim = tokenEmbeds[0].length;
//   const sum = new Array(dim).fill(0);
//   for (const vec of tokenEmbeds) {
//     for (let i = 0; i < dim; i++) sum[i] += vec[i];
//   }
//   return sum.map((v) => v / tokenEmbeds.length);
// }

// // ─── Public API ──────────────────────────────────────────────────────────────

// /**
//  * Embed a single query string.
//  * @param {string} text
//  * @returns {Promise<number[]>}
//  */
// export async function embedQuery(text) {
//   const clean = text.replace(/\n/g, " ").trim();
//   const result = await hfEmbed([clean]);
//   return result[0];
// }

// /**
//  * Embed an array of chunk texts, batched to respect free-tier limits.
//  * @param {string[]} texts
//  * @returns {Promise<number[][]>}
//  */
// export async function embedChunks(texts) {
//   const allEmbeddings = [];
//   const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

//   for (let i = 0; i < texts.length; i += BATCH_SIZE) {
//     const batchNum = Math.floor(i / BATCH_SIZE) + 1;
//     const batch = texts
//       .slice(i, i + BATCH_SIZE)
//       .map((t) => t.replace(/\n/g, " ").trim());

//     console.log(
//       `[Embedder] Batch ${batchNum}/${totalBatches} — ${batch.length} chunks`,
//     );

//     const embeddings = await hfEmbed(batch);
//     allEmbeddings.push(...embeddings);

//     // Throttle between batches on free tier
//     if (i + BATCH_SIZE < texts.length) {
//       await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
//     }
//   }

//   console.log(
//     `[Embedder] Done — ${allEmbeddings.length} embeddings, dim=${allEmbeddings[0]?.length}`,
//   );
//   return allEmbeddings;
// }


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