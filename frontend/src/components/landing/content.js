// Landing copy. Pipeline facts mirror backend/src; every link points at real code.

export const REPO_URL = "https://github.com/MohitSAGAR11/Notebook-LM";
export const DEMO_URL = "https://mohitsagar11.github.io/videos/notebooklm.mp4";
const SRC = `${REPO_URL}/blob/main/backend/src`;

export const STATS = [
  { value: "800", label: ["Characters", "per passage"] },
  { value: "×3", label: ["Searches", "per question"] },
  { value: "5", label: ["Passages", "per answer"] },
];

export const SHOWCASE = [
  {
    title: "File it",
    body: "Drop in a PDF or .txt, up to 100 MB",
    img: "/shots/file.webp",
    tone: "lime",
    alt: "The upload screen with a file being indexed",
  },
  {
    title: "Ask it",
    body: "Plain-language questions, answered from the file",
    img: "/shots/ask.webp",
    tone: "orange",
    alt: "An answer in the notebook with its numbered sources",
  },
  {
    title: "Check it",
    body: "Open any source to read the exact passage",
    img: "/shots/check.webp",
    tone: "white",
    alt: "A source passage opened next to the answer",
  },
];

export const PIPELINE = [
  {
    title: "Read the file",
    body: "PDFs are read page by page with pdf.js, so long files don't flood memory. Text files are streamed in.",
    meta: ["rag.js", "PDF · TXT"],
    href: `${SRC}/rag.js`,
  },
  {
    title: "Cut it into passages",
    body: "A recursive splitter breaks on paragraphs, then lines, then sentences. Neighbouring passages overlap so no thought gets cut in half.",
    meta: ["chunker.js", "800 chars · 150 overlap"],
    href: `${SRC}/chunker.js`,
  },
  {
    title: "Index every passage",
    body: "Each passage becomes a 384-number vector with MiniLM on Hugging Face, stored in Pinecone under its own namespace per document.",
    meta: ["embedder.js · vectorStore.js", "all-MiniLM-L6-v2"],
    href: `${SRC}/vectorStore.js`,
  },
  {
    title: "Search wider than the question",
    body: "Your question is rephrased two more ways through OpenRouter. All three versions search the index; results are merged and de-duplicated.",
    meta: ["rag.js", "3 queries × top 5"],
    href: `${SRC}/rag.js`,
  },
  {
    title: "Re-rank the candidates",
    body: "A language model scores every candidate passage from 0 to 10 on whether it actually answers you. Only the best five go forward.",
    meta: ["reranker.js", "LLM rerank → 5"],
    href: `${SRC}/reranker.js`,
  },
  {
    title: "Answer from those five only",
    body: "gpt-oss-120b writes the answer at temperature 0.1 using only the chosen passages and your recent turns. If they don't cover it, it says so.",
    meta: ["rag.js", "grounded generation"],
    href: `${SRC}/rag.js`,
  },
];

export const FAQ = [
  {
    q: "Does it make things up?",
    a: "It is told to answer only from the passages it retrieved and to say when the document doesn't cover the question. Every answer lists those passages, so you can check it in one click.",
    meta: ["Grounding", "Answers"],
  },
  {
    q: "What can I upload?",
    a: "One PDF or plain-text file per notebook, up to 100 MB. Scanned PDFs without a text layer won't work: it reads text, not images.",
    meta: ["Files", "Limits"],
  },
  {
    q: "Why is the first answer slow?",
    a: "The backend runs on free tiers. After a quiet spell the server needs up to a minute to wake, and each answer makes several model calls before it writes a word.",
    meta: ["Speed", "Hosting"],
  },
];
