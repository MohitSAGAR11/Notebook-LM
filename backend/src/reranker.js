/**
 * reranker.js
 *
 * LLM-based cross-encoder reranker.
 * Takes a list of retrieved candidates and the original question,
 * asks the LLM to score each chunk's relevance (0–10),
 * then returns the top-K highest scoring chunks.
 */

import { getLLM, LLM_MODEL } from "./llm.js";

/**
 * Score a single chunk's relevance to the question (0–10).
 * @param {string} question
 * @param {string} chunkText
 * @returns {Promise<number>}
 */
async function scoreChunk(question, chunkText) {
  try {
    const response = await getLLM().chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a relevance scorer. Given a question and a document excerpt, output ONLY a single integer from 0 to 10 representing how relevant the excerpt is to the question. 10 = perfectly answers the question, 0 = completely irrelevant. Output ONLY the number, nothing else.`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nExcerpt:\n${chunkText.slice(0, 600)}`,
        },
      ],
      temperature: 0,
      // gpt-oss is a reasoning model: reasoning tokens count against
      // max_tokens, so a budget of 4 can leave the reply empty, which made
      // every chunk score 0 and silently disabled reranking.
      max_tokens: 256,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const score = parseInt(raw.match(/\d+/)?.[0] ?? "", 10);
    return isNaN(score) ? 0 : Math.min(10, Math.max(0, score));
  } catch {
    return 0;
  }
}

/**
 * Rerank candidates and return the top-K most relevant.
 * @param {string} question - original user question
 * @param {Array<{ text: string, score: number, metadata: object }>} candidates
 * @param {number} topK - how many to keep after reranking
 * @returns {Promise<Array<{ text: string, score: number, metadata: object }>>}
 */
export async function rerank(question, candidates, topK = 5) {
  if (candidates.length <= topK) return candidates;

  console.log(`[Reranker] Scoring ${candidates.length} candidates...`);

  // Score all candidates in parallel (fast for small N)
  const scored = await Promise.all(
    candidates.map(async (c) => ({
      ...c,
      rerankScore: await scoreChunk(question, c.text),
    }))
  );

  // Sort descending by rerank score, fall back to original cosine score on tie
  scored.sort((a, b) =>
    b.rerankScore !== a.rerankScore
      ? b.rerankScore - a.rerankScore
      : b.score - a.score
  );

  const top = scored.slice(0, topK);
  console.log(
    `[Reranker] Top scores: ${top.map((c) => c.rerankScore).join(", ")}`
  );
  return top;
}
