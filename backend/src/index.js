import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { ingestDocument, answerQuestion } from "./rag.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain"];
    const allowedExt = [".pdf", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and plain text (.txt) files are supported."));
    }
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * POST /api/upload
 * Accepts a PDF or .txt file, runs the full ingestion pipeline.
 * Returns a docId the client uses for subsequent chat requests.
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const docId = uuidv4().replace(/-/g, ""); // Pinecone namespace (alphanumeric)
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const mimeType = req.file.mimetype;

  try {
    const result = await ingestDocument({
      filePath,
      mimeType,
      docId,
      fileName,
    });

    // Clean up the uploaded temp file after ingestion
    fs.unlink(filePath, () => {});

    res.json({
      success: true,
      docId: result.docId,
      fileName,
      chunkCount: result.chunkCount,
      message: `Document ingested successfully into ${result.chunkCount} chunks.`,
    });
  } catch (err) {
    console.error("[Upload Error]", err);
    fs.unlink(filePath, () => {}); // cleanup on error too
    res
      .status(500)
      .json({ error: err.message || "Failed to process document." });
  }
});

/**
 * POST /api/chat
 * Body: { docId: string, question: string, history: Array }
 * Returns: { answer: string, sources: Array }
 */
app.post("/api/chat", async (req, res) => {
  const { docId, question, history = [] } = req.body;

  if (!docId) return res.status(400).json({ error: "docId is required." });
  if (!question?.trim())
    return res.status(400).json({ error: "question is required." });

  try {
    const result = await answerQuestion({
      docId,
      question: question.trim(),
      history,
    });
    res.json(result);
  } catch (err) {
    console.error("[Chat Error]", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to generate answer." });
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NotebookLM backend running at http://localhost:${PORT}`);
  console.log(
    `   Pinecone index: ${process.env.PINECONE_INDEX_NAME || "notebooklm"}`,
  );
});

// Keep-alive ping for Render free tier
const BACKEND_URL = process.env.RENDER_EXTERNAL_URL;
if (BACKEND_URL) {
  setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/health`);
      console.log("[Keep-alive] pinged");
    } catch (e) {}
  }, 10 * 60 * 1000); // every 10 minutes
}
