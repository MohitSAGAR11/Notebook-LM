# 📓 NotebookLM Clone — RAG Application

> A full RAG pipeline application where users can upload documents and chat with them.

🔗 **Live Demo:** [rag-notebook-lm.netlify.app](https://rag-notebook-lm.netlify.app/)

---

## Advanced RAG Pipeline

| Step | Stage | Description |
|------|-------|-------------|
| 01 | **Ingestion** | User uploads a PDF or `.txt` file. Text is extracted from PDFs page-by-page using `pdfjs-dist` to optimize memory usage. |
| 02 | **Chunking** | Custom Recursive Character Splitter — 800-character chunks with 150-character overlap. Splits recursively on separators (paragraphs, newlines, sentences, and spaces) to preserve context. Each chunk includes metadata: `{ source, chunkIndex, totalChunks, charCount }`. |
| 03 | **Embedding** | `HuggingFaceInferenceEmbeddings` via `@langchain/community` (using model `sentence-transformers/all-MiniLM-L6-v2`) to embed chunks in parallel batches. |
| 04 | **Storage** | Pinecone serverless index. Chunks are stored in a dedicated document-level namespace to ensure clean isolation between different uploads. |
| 05 | **Advanced Retrieval** | **1. Query Expansion**: The original question is expanded into 3 variants (1 original + 2 rephrasings) using `gpt-oss-120b` via OpenRouter to maximize recall.<br>**2. Multi-Query Search**: Similarity search (Top-K=5) is performed for all 3 variants in Pinecone, and candidate results are merged and deduplicated.<br>**3. LLM Reranking (Cross-Encoder)**: Merged candidate chunks are evaluated in parallel by `gpt-oss-120b` to score their relevance (0–10). High-scoring chunks are sorted (falling back to cosine similarity on ties) and the top 5 are selected. |
| 06 | **Grounded Generation** | The top 5 reranked contexts are formatted into a grounded prompt. An LLM (`gpt-oss-120b:free` via OpenRouter) generates the final answer strictly adhering to the context at a low temperature of `0.1` to eliminate hallucinations. Multi-turn chat history is also incorporated. |

---

## Tech Stack

### Backend

| Package | Role |
|---------|------|
| `express` | REST API server |
| `multer` | File upload handling |
| `pdfjs-dist` | PDF text extraction (page-by-page) |
| `@langchain/community` | Hugging Face Embeddings integration |
| `@pinecone-database/pinecone` | Vector database for namespace storage |
| `openai` | Client for OpenRouter (`gpt-oss-120b:free`) for generation, query expansion, and reranking |

### Frontend

| Package | Role |
|---------|------|
| `vite + react` | Fast dev build |
| `tailwindcss` | Utility-first styling |
| `UploadZone` | Drag & drop file upload UI |
| `ChatWindow` | Conversation display |
| `MessageBubble` | Message rendering |
| `SourceChips` | Citation/source display |

---

## Setup

### Environment Variables

**`backend/.env`**
```env
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=notebooklm
OPENROUTER_API_KEY=your_openrouter_api_key
HUGGINGFACEHUB_API_KEY=your_hf_access_token
```

**`frontend/.env`**
```env
VITE_API_URL=backend_deployed_url
```

### Run Locally

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

---

## File Structure

```
notebooklm/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── chunker.js        # Recursive character chunker
│   │   ├── embedder.js       # Hugging Face embedding generator
│   │   ├── vectorStore.js    # Pinecone namespace integration
│   │   ├── reranker.js       # LLM cross-encoder reranking logic
│   │   └── rag.js            # Advanced RAG pipeline orchestrator
│   ├── uploads/              # Temp file storage
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── UploadZone.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageBubble.jsx
    │   │   └── SourceChips.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```