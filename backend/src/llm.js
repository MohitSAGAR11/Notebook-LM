/**
 * llm.js
 *
 * Shared, lazily-created OpenRouter client. Creating the OpenAI client at
 * module load throws when OPENROUTER_API_KEY is missing, which used to crash
 * the whole server (including /api/health). Creating it on first use keeps the
 * server up and turns a missing key into a clear per-request error instead.
 *
 * Free models get retired without notice, so the model is configurable
 * (OPENROUTER_MODEL) and every request carries OpenRouter's `models` fallback
 * list: if the primary is unavailable, the request falls through to the
 * free-model router instead of failing.
 */

import OpenAI from "openai";

const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const FALLBACK_MODEL = "openrouter/free";

export const LLM_MODEL = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
const MODEL_CHAIN = [...new Set([LLM_MODEL, FALLBACK_MODEL])];

let client = null;

export function getLLM() {
  if (client) return client;

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing from .env");

  client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
  return client;
}

/**
 * Chat completion with the configured model and fallback chain.
 * @param {object} params - OpenAI chat.completions params, minus `model`
 * @returns {Promise<string>} the reply text ("" when the model returned none)
 */
export async function complete(params) {
  const response = await getLLM().chat.completions.create({
    ...params,
    model: MODEL_CHAIN[0],
    models: MODEL_CHAIN,
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}
