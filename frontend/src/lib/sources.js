// Sources are the passages an answer relied on. Each distinct chunk gets one
// number per notebook, in the order it was first cited, so "1" means the same
// passage everywhere in a conversation.

/**
 * Merge an answer's sources into the register without mutating it.
 * @param {Array<object>} register existing sources
 * @param {Array<object>} incoming sources from one answer
 * @returns {{ register: Array<object>, cited: number[] }} new register and the numbers this answer cites
 */
export function fileSources(register, incoming) {
  const next = [...register];
  const cited = [];
  for (const src of incoming) {
    const key = `${src.source ?? ""}#${src.chunkIndex}`;
    let entry = next.find((s) => s.key === key);
    if (!entry) {
      entry = {
        key,
        number: next.length + 1,
        chunkIndex: src.chunkIndex,
        source: src.source,
        score: typeof src.score === "number" ? src.score : null,
        text: src.fullText || src.text || "",
        isExcerpt: !src.fullText,
      };
      next.push(entry);
    }
    if (!cited.includes(entry.number)) cited.push(entry.number);
  }
  return { register: next, cited };
}

/** "Passage 4" (1-based chunk position), or "Passage" when unknown. */
export function passageLabel(chunkIndex) {
  return Number.isFinite(chunkIndex) ? `Passage ${chunkIndex + 1}` : "Passage";
}

/** Cosine similarity as a percentage string. */
export function formatMatch(score) {
  return typeof score === "number" ? `${Math.round(score * 100)}%` : "n/a";
}
