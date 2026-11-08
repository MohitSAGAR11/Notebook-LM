/**
 * llm.js
 *
 * Shared, lazily-created OpenRouter client. Creating the OpenAI client at
 * module load throws when OPENROUTER_API_KEY is missing, which used to crash
 * the whole server (including /api/health). Creating it on first use keeps the
 * server up and turns a missing key into a clear per-request error instead.
 */

import OpenAI from "openai";

export const LLM_MODEL = "openai/gpt-oss-120b:free";

let client = null;

export function getLLM() {
  if (client) return client;

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing from .env");

  client = new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" });
  return client;
}
