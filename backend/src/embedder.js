/**
 * embedder.js
 *
 * Runs sentence-transformers/all-MiniLM-L6-v2 locally with transformers.js
 * (ONNX, quantized). Same model and the same 384-dim, mean-pooled, normalized
 * vectors the Hugging Face Inference API returned, so the Pinecone index is
 * unchanged — but no API key or inference credits are needed.
 *
 * The model files (~23 MB) are downloaded from the Hugging Face Hub on first
 * use and cached on disk.
 */

import { pipeline } from "@huggingface/transformers";

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const ONNX_MODEL = "Xenova/all-MiniLM-L6-v2"; // ONNX export of the same weights
const BATCH_SIZE = 32; // bounds peak memory on small instances

let extractorPromise = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", ONNX_MODEL, { dtype: "q8" }).catch((err) => {
      extractorPromise = null; // allow a retry on the next request
      throw new Error(`Could not load embedding model: ${err.message}`);
    });
  }
  return extractorPromise;
}

/** Load the model ahead of the first request. Failures are retried lazily. */
export function warmUpEmbedder() {
  getExtractor()
    .then(() => console.log(`[Embedder] ${EMBEDDING_MODEL} loaded`))
    .catch((err) => console.error(`[Embedder] warm-up failed: ${err.message}`));
}

const clean = (t) => t.replace(/\n/g, " ").trim();

async function embedBatch(texts) {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}

/**
 * Embed a single query string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedQuery(text) {
  const [vector] = await embedBatch([clean(text)]);
  return vector;
}

/**
 * Embed an array of chunk texts, in batches.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedChunks(texts) {
  const cleaned = texts.map(clean);
  console.log(`[Embedder] Embedding ${cleaned.length} chunks locally...`);

  const vectors = [];
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    vectors.push(...(await embedBatch(cleaned.slice(i, i + BATCH_SIZE))));
  }

  console.log(`[Embedder] Done — ${vectors.length} vectors, dim=${vectors[0]?.length ?? "?"}`);
  return vectors;
}
