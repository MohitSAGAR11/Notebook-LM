/**
 * reranker.js
 *
 * LLM-based listwise reranker.
 * Sends the question and every retrieved candidate in ONE request and asks
 * the LLM for a 0–10 relevance score per excerpt, then keeps the top-K.
 *
 * One call instead of one per candidate: on OpenRouter's free tier
 * (50 requests/day) per-chunk scoring spent up to 15 requests per question.
 * If the reply can't be parsed, the cosine-similarity order is kept.
 */

import { complete } from "./llm.js";

const EXCERPT_CHARS = 600;

/**
 * Parse "[7, 3, 10]"-style output into exactly `count` scores, or null.
 * @param {string} raw
 * @param {number} count
 * @returns {number[] | null}
 */
export function parseScores(raw, count) {
  // Replies may echo excerpt labels like "[1]" before the answer, so take the
  // last flat array that has exactly one entry per excerpt.
  const arrays = [...raw.matchAll(/\[[^[\]]*\]/g)].map((m) => m[0]).reverse();
  for (const text of arrays) {
    try {
      const values = JSON.parse(text);
      if (!Array.isArray(values) || values.length !== count) continue;
      return values.map((v) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : 0;
      });
    } catch {
      // not JSON; try the previous array
    }
  }
  return null;
}

/**
 * Score every candidate in a single LLM request.
 * @param {string} question
 * @param {Array<{ text: string }>} candidates
 * @returns {Promise<number[] | null>} one score per candidate, or null on failure
 */
async function scoreAll(question, candidates) {
  const excerpts = candidates
    .map((c, i) => `[${i + 1}]\n${c.text.slice(0, EXCERPT_CHARS)}`)
    .join("\n\n");

  try {
    const raw = await complete({
      messages: [
        {
          role: "system",
          content: `You are a relevance scorer. Given a question and ${candidates.length} numbered document excerpts, rate how relevant each excerpt is to the question from 0 (irrelevant) to 10 (directly answers it). Output ONLY a JSON array of ${candidates.length} integers, in excerpt order. No explanation.`,
        },
        { role: "user", content: `Question: ${question}\n\nExcerpts:\n\n${excerpts}` },
      ],
      temperature: 0,
      // Room for reasoning models, whose thinking counts against max_tokens.
      max_tokens: 1024,
    });
    return parseScores(raw, candidates.length);
  } catch (err) {
    console.error(`[Reranker] scoring failed: ${err.message}`);
    return null;
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

  console.log(`[Reranker] Scoring ${candidates.length} candidates in one request...`);
  const scores = await scoreAll(question, candidates);

  if (!scores) {
    console.log("[Reranker] Unparseable scores; keeping similarity order.");
    return [...candidates].sort((a, b) => b.score - a.score).slice(0, topK);
  }

  // Sort descending by rerank score, fall back to original cosine score on tie
  const top = candidates
    .map((c, i) => ({ ...c, rerankScore: scores[i] }))
    .sort((a, b) =>
      b.rerankScore !== a.rerankScore ? b.rerankScore - a.rerankScore : b.score - a.score,
    )
    .slice(0, topK);

  console.log(`[Reranker] Top scores: ${top.map((c) => c.rerankScore).join(", ")}`);
  return top;
}
