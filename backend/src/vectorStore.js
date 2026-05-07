import { Pinecone } from "@pinecone-database/pinecone";

const DIMENSION = 384;
const METRIC = "cosine";

let pinecone = null;
let index = null;

async function getIndex() {
  if (index) return index;

  pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const indexName = process.env.PINECONE_INDEX_NAME || "notebooklm";

  // Check if index exists; create if not
  const { indexes } = await pinecone.listIndexes();
  const exists = indexes?.some((idx) => idx.name === indexName);

  if (!exists) {
    console.log(`Creating Pinecone index: ${indexName}...`);
    await pinecone.createIndex({
      name: indexName,
      dimension: DIMENSION,
      metric: METRIC,
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    // Wait for index to be ready
    let ready = false;
    while (!ready) {
      await new Promise((r) => setTimeout(r, 2000));
      const desc = await pinecone.describeIndex(indexName);
      ready = desc.status?.ready;
      if (!ready) console.log("Waiting for index to be ready...");
    }
    console.log("Pinecone index ready.");
  }

  index = pinecone.index(indexName);
  return index;
}

/**
 * Upsert chunks + their embeddings into Pinecone under a namespace.
 * Each document gets its own namespace (derived from a docId) so multiple
 * documents can coexist in the same index.
 *
 * @param {string} namespace - unique doc identifier
 * @param {Array<{ text: string, metadata: object }>} chunks
 * @param {number[][]} embeddings - parallel array of vectors
 */
// Change the signature:
export async function upsertVectors(
  namespace,
  chunks,
  embeddings,
  startIndex = 0,
) {
  const idx = await getIndex();

  const vectors = chunks.map((chunk, i) => ({
    id: `${namespace}_chunk_${startIndex + i}`, // ← offset fixes ID collision
    values: embeddings[i],
    metadata: {
      text: chunk.text,
      ...chunk.metadata,
    },
  }));

  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await idx.namespace(namespace).upsert(vectors.slice(i, i + BATCH));
  }

  console.log(`Upserted ${vectors.length} vectors to namespace: ${namespace}`);
}

/**
 * Query Pinecone for the top-K most similar chunks to a query embedding.
 *
 * @param {string} namespace - document namespace to search in
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @returns {Promise<Array<{ text: string, score: number, metadata: object }>>}
 */
export async function queryVectors(namespace, queryEmbedding, topK = 5) {
  const idx = await getIndex();

  const result = await idx.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (result.matches || []).map((match) => ({
    text: match.metadata?.text || "",
    score: match.score,
    metadata: match.metadata,
  }));
}

/**
 * Delete all vectors for a document namespace (cleanup).
 * @param {string} namespace
 */
export async function deleteNamespace(namespace) {
  const idx = await getIndex();
  await idx.namespace(namespace).deleteAll();
  console.log(`Deleted namespace: ${namespace}`);
}
