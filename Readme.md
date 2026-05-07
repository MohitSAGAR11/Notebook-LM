# 📓 NotebookLM Clone — RAG Application

> A full RAG pipeline application where users can upload documents and chat with them.

🔗 **Live Demo:** [rag-notebook-lm.netlify.app](https://rag-notebook-lm.netlify.app/)

---

## RAG Pipeline

| Step | Stage | Description |
|------|-------|-------------|
| 01 | **Ingestion** | User uploads a PDF or `.txt` file. Text is extracted using `pdf-parse` (PDF) or read directly (txt). |
| 02 | **Chunking** | Recursive Character Text Splitter — 800-token chunks with 150-token overlap. Splits on paragraph → sentence → word boundaries to preserve semantic coherence. Each chunk gets metadata: `{ source, page, chunkIndex, totalChunks }`. |
| 03 | **Embedding** | `HuggingFaceInferenceEmbeddings` via `@langchain/community` — handles the correct API endpoint, cold-start waiting, and response parsing internally. |
| 04 | **Storage** | Pinecone serverless index (free tier supports up to 1M vectors). Each vector stored with full chunk text + metadata for retrieval. |
| 05 | **Retrieval** | Top-K=5 similarity search using cosine similarity. Query is embedded with the same model as the documents. |
| 06 | **Generation** | Retrieved chunks assembled into a grounded context prompt. OpenRouter models answer **only** from retrieved context via a strict system prompt. |

---

## Tech Stack

### Backend

| Package | Role |
|---------|------|
| `express` | REST API server |
| `multer` | File upload handling |
| `pdfjs-dist` | PDF text extraction |
| `@langchain/openai` | OpenAI embeddings (`text-embedding-3-small`) |
| `@pinecone-database/pinecone` | Vector database (free tier) |
| `openai` | GPT-4.1-mini for answer generation |

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
│   │   ├── chunker.js        # Recursive text splitter
│   │   ├── embedder.js       # Embedding logic
│   │   ├── vectorStore.js    # Pinecone integration
│   │   └── rag.js            # Full RAG pipeline orchestrator
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