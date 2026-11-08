// Thin client for the RAG backend. Contract:
//   POST /api/upload  multipart "file"            -> { docId, fileName, chunkCount }
//   POST /api/chat    { docId, question, history } -> { answer, sources[] }

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".pdf", ".txt"];

/**
 * Check a file before sending it, so obvious problems never cost a round trip.
 * @param {File} file
 * @returns {string|null} a user-facing problem, or null when the file is fine
 */
export function validateFile(file) {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return `“${file.name}” isn't a PDF or .txt file. Those are the two formats the reader understands.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The limit is 100 MB.`;
  }
  if (file.size === 0) {
    return `“${file.name}” is empty.`;
  }
  return null;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readError(status, body) {
  if (body && typeof body.error === "string") return body.error;
  if (status === 0) return "Couldn't reach the server. Check your connection and try again.";
  if (status >= 500) return "The server hit an error while working on this. Try again in a moment.";
  return `The request failed (HTTP ${status}).`;
}

/**
 * Upload a document. XHR instead of fetch because fetch can't report upload progress.
 * @param {File} file
 * @param {{ onProgress?: (fraction: number) => void, onSent?: () => void, signal?: AbortSignal }} opts
 * @returns {Promise<{ docId: string, fileName: string, chunkCount: number }>}
 */
export function uploadDocument(file, { onProgress, onSent, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/upload`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.upload.onload = () => onSent?.();
    xhr.onload = () => {
      const body = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && body?.docId) resolve(body);
      else reject(new Error(readError(xhr.status, body)));
    };
    xhr.onerror = () => reject(new Error(readError(0)));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/**
 * Ask a question about an ingested document.
 * @param {{ docId: string, question: string, history: Array<{role: string, content: string}> }} payload
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ answer: string, sources: Array<object> }>}
 */
export async function askQuestion(payload, signal) {
  let res;
  try {
    res = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(readError(0), { cause: err });
  }

  const body = await res.json().catch((err) => {
    if (err.name === "AbortError") throw err; // Stop pressed mid-download
    return null;
  });
  if (!res.ok) throw new Error(readError(res.status, body));
  if (!body || typeof body.answer !== "string") {
    throw new Error("The server sent back an answer in a shape this page doesn't understand.");
  }
  return { answer: body.answer, sources: Array.isArray(body.sources) ? body.sources : [] };
}
