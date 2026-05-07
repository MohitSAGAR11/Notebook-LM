const CHUNK_SIZE = 800; // characters per chunk (≈ 150-200 tokens for English)
const CHUNK_OVERLAP = 150; // overlap between consecutive chunks

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

/**
 * Split text recursively using the given separators.
 * @param {string} text
 * @param {string[]} separators
 * @returns {string[]} array of raw splits
 */
function splitText(text, separators) {
  const results = [];
  const separator = separators[0] ?? "";
  const nextSeparators = separators.slice(1);

  const splits = separator ? text.split(separator) : text.split("");

  let currentBatch = "";

  for (const split of splits) {
    const piece = currentBatch ? currentBatch + separator + split : split;

    if (piece.length <= CHUNK_SIZE) {
      currentBatch = piece;
    } else {
      // Save current batch if non-empty
      if (currentBatch.trim()) {
        results.push(currentBatch.trim());
      }
      // If the single split is still too large, recurse with finer separator
      if (split.length > CHUNK_SIZE && nextSeparators.length > 0) {
        const subSplits = splitText(split, nextSeparators);
        results.push(...subSplits);
        currentBatch = "";
      } else {
        currentBatch = split;
      }
    }
  }

  if (currentBatch.trim()) {
    results.push(currentBatch.trim());
  }

  return results;
}

/**
 * Merge small splits into chunks of ~CHUNK_SIZE with CHUNK_OVERLAP overlap.
 * @param {string[]} splits
 * @returns {string[]} merged chunks
 */
function mergeWithOverlap(splits) {
  const chunks = [];
  let current = [];
  let currentLen = 0;

  for (const split of splits) {
    if (currentLen + split.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.join(" "));

      // Keep overlap: retain tail of current buffer that fits in overlap window
      let overlapLen = 0;
      const overlapParts = [];
      for (let i = current.length - 1; i >= 0; i--) {
        if (overlapLen + current[i].length <= CHUNK_OVERLAP) {
          overlapParts.unshift(current[i]);
          overlapLen += current[i].length;
        } else {
          break;
        }
      }
      current = overlapParts;
      currentLen = overlapLen;
    }

    current.push(split);
    currentLen += split.length;
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

/**
 * Main export: chunk a full document text into overlapping chunks with metadata.
 *
 * @param {string} text - full extracted document text
 * @param {string} source - filename or document identifier
 * @returns {Array<{ text: string, metadata: object }>}
 */
export function chunkDocument(text, source) {
  // Normalize whitespace: collapse 3+ newlines to 2
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();

  const rawSplits = splitText(normalized, SEPARATORS);
  const chunks = mergeWithOverlap(rawSplits);

  return chunks
    .filter((c) => c.trim().length > 30) // discard micro-chunks
    .map((text, index) => ({
      text: text.trim(),
      metadata: {
        source,
        chunkIndex: index,
        totalChunks: chunks.length,
        charCount: text.length,
      },
    }));
}
