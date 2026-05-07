# NotebookLM Clone — RAG Application

A full RAG pipeline application where users can upload documents and chat with them.

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **pdf-parse** — PDF text extraction
- **@langchain/openai** — OpenAI embeddings (`text-embedding-3-small`)
- **@pinecone-database/pinecone** — Vector database (free tier)
- **openai** — GPT-4.1-mini for answer generation
- **multer** — File upload handling

### Frontend
- **Vite + React** — Fast dev build
- **Tailwind CSS** — Utility-first styling

## RAG Pipeline

### 1. Ingestion
- User uploads a PDF or `.txt` file
- Text is extracted using `pdf-parse` (PDF) or read directly (txt)

### 2. Chunking Strategy
- **Recursive Character Text Splitter** (implemented from scratch)
- Chunk size: **800 tokens** with **150 token overlap**
- Splits on paragraph → sentence → word boundaries to preserve semantic coherence
- Each chunk gets metadata: `{ source, page, chunkIndex, totalChunks }`

### 3. Embedding
- Model: `text-embedding-3-small` (1536 dimensions, cost-efficient, high quality)
- Batched in groups of 100 to respect API limits

### 4. Storage
- **Pinecone** serverless index (free tier supports up to 1M vectors)
- Each vector stored with full chunk text + metadata for retrieval

### 5. Retrieval
- Top-K=5 similarity search using cosine similarity
- Query is embedded with the same model

### 6. Generation
- Retrieved chunks assembled into a grounded context prompt
- GPT-4.1-mini answers ONLY from retrieved context (strict system prompt)

## Setup

### Environment Variables

**Backend** (`backend/.env`):
```
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=notebooklm
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001
```

### Run

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

## File Structure

```
notebooklm/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── chunker.js        # Recursive text splitter
│   │   ├── embedder.js       # OpenAI embedding logic
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