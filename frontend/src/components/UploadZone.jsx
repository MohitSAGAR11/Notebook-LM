import React, { useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function UploadZone({ onDocumentReady }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "txt"].includes(ext)) {
      setError("Only PDF and .txt files are supported.");
      return;
    }

    setStatus("uploading");
    setError("");
    setProgress("Extracting text...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress("Chunking & embedding...");
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setStatus("done");
      onDocumentReady({
        docId: data.docId,
        fileName: data.fileName,
        chunkCount: data.chunkCount,
      });
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div style={styles.wrapper} className="fade-up">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="rgba(200,180,250,0.12)" />
            <path d="M7 8h14M7 13h10M7 18h12" stroke="#c8b4fa" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="21" cy="18" r="4" fill="#c8b4fa" opacity="0.9" />
            <path d="M21 16.5v3M19.5 18h3" stroke="#0c0c0e" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>NotebookLM</h1>
          <p style={styles.subtitle}>Upload a document. Ask anything.</p>
        </div>
      </div>

      {/* Drop zone */}
      {status !== "done" && (
        <div
          style={{
            ...styles.dropzone,
            ...(dragging ? styles.dropzoneActive : {}),
            ...(status === "uploading" ? styles.dropzoneProcessing : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => status === "idle" && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {status === "idle" && (
            <div style={styles.dropContent}>
              <div style={styles.uploadIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L16 22M8 12L16 4L24 12" stroke="#c8b4fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 26h20" stroke="#c8b4fa" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
              <p style={styles.dropTitle}>Drop your document here</p>
              <p style={styles.dropSub}>PDF or TXT · up to 20 MB · <span style={{ color: "var(--accent)" }}>browse files</span></p>
            </div>
          )}

          {status === "uploading" && (
            <div style={styles.dropContent}>
              <div style={styles.spinner} />
              <p style={styles.dropTitle}>{progress}</p>
              <p style={styles.dropSub}>Indexing into vector database...</p>
            </div>
          )}

          {status === "error" && (
            <div style={styles.dropContent}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <p style={{ ...styles.dropTitle, color: "var(--red)" }}>Upload failed</p>
              <p style={styles.dropSub}>{error}</p>
              <button style={styles.retryBtn} onClick={(e) => { e.stopPropagation(); setStatus("idle"); setError(""); }}>
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      {status === "idle" && (
        <div style={styles.features} className="fade-in">
          {[
            { icon: "⚡", label: "Recursive chunking", desc: "Semantically coherent splits" },
            { icon: "🔮", label: "text-embedding-3-small", desc: "1536-dim OpenAI embeddings" },
            { icon: "📦", label: "Pinecone vector DB", desc: "Cosine similarity search" },
            { icon: "🧠", label: "GPT-4.1-mini", desc: "Grounded answers only" },
          ].map((f) => (
            <div key={f.label} style={styles.feature}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <div>
                <p style={styles.featureLabel}>{f.label}</p>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    padding: "60px 24px",
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logo: {
    flexShrink: 0,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "28px",
    fontStyle: "italic",
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: "14px",
  },
  dropzone: {
    width: "100%",
    border: "1.5px dashed var(--border)",
    borderRadius: "16px",
    padding: "52px 32px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "var(--bg-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneActive: {
    borderColor: "var(--accent)",
    background: "var(--accent-dim)",
    boxShadow: "0 0 0 4px var(--accent-glow)",
  },
  dropzoneProcessing: {
    cursor: "not-allowed",
    opacity: 0.8,
  },
  dropContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  uploadIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "var(--accent-dim)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropTitle: {
    fontSize: "17px",
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  dropSub: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "2.5px solid var(--bg-4)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  retryBtn: {
    marginTop: "8px",
    padding: "8px 20px",
    background: "var(--accent-dim)",
    border: "1px solid var(--accent)",
    borderRadius: "8px",
    color: "var(--accent)",
    fontSize: "13px",
    fontFamily: "var(--font-body)",
    cursor: "pointer",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    width: "100%",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    background: "var(--bg-2)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  featureIcon: {
    fontSize: "20px",
    flexShrink: 0,
    marginTop: "1px",
  },
  featureLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
  },
  featureDesc: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
};