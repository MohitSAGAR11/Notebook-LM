import React, { useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function UploadZone({ onDocumentReady }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle");
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
      <div style={styles.header}>
        <div style={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-plum-voltage)" strokeWidth="1.5">
            <path d="M12 2L2 12l10 10 10-10L12 2zM12 2v20M2 12h20" />
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>Dala Workspace</h1>
          <p style={styles.subtitle}>Upload your source document to start workspace indexing.</p>
        </div>
      </div>

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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-plum-voltage)" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <p style={styles.dropTitle}>Select or drop file</p>
              <p style={styles.dropSub}>PDF or TXT · up to 20 MB · <span style={{ color: "var(--color-plum-voltage)" }}>browse</span></p>
            </div>
          )}

          {status === "uploading" && (
            <div style={styles.dropContent}>
              <div style={styles.spinner} />
              <p style={styles.dropTitle}>{progress}</p>
              <p style={styles.dropSub}>Processing document elements into vector store...</p>
            </div>
          )}

          {status === "error" && (
            <div style={styles.dropContent}>
              <div style={styles.errorIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4a4a" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p style={{ ...styles.dropTitle, color: "#ff4a4a" }}>Upload failed</p>
              <p style={styles.dropSub}>{error}</p>
              <button style={styles.retryBtn} onClick={(e) => { e.stopPropagation(); setStatus("idle"); setError(""); }}>
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {status === "idle" && (
        <div style={styles.features} className="fade-in">
          {[
            { label: "Recursive character chunker", desc: "800-character segments with 150-character overlaps preserving syntactic coherence." },
            { label: "Vector representation", desc: "Hugging Face MiniLM embeddings mapped to 384 dimensional space." },
            { label: "Isolated namespaces", desc: "Encapsulated query segments stored securely in Pinecone serverless namespaces." },
            { label: "Grounded LLM output", desc: "Response synthesis using strict GPT-OSS-120B prompts focused purely on sources." },
          ].map((f) => (
            <div key={f.label} style={styles.feature}>
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
    gap: "30px",
    padding: "60px 24px",
    maxWidth: "600px",
    margin: "0 auto",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    width: "100%",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontFamily: "var(--font-acronym)",
    fontSize: "var(--text-heading-sm)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-bone)",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    color: "var(--color-smoke)",
    fontSize: "var(--text-body-sm)",
    marginTop: "2px",
  },
  dropzone: {
    width: "100%",
    border: "1px dashed rgba(255, 255, 255, 0.15)",
    borderRadius: "var(--radius-cards)",
    padding: "60px 24px",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background 0.2s ease",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneActive: {
    borderColor: "var(--color-plum-voltage)",
    background: "rgba(128, 82, 255, 0.05)",
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
    width: "48px",
    height: "48px",
    borderRadius: "var(--radius-buttons)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropTitle: {
    fontFamily: "var(--font-acronym)",
    fontSize: "15px",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-bone)",
  },
  dropSub: {
    fontSize: "var(--text-caption)",
    color: "var(--color-smoke)",
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "1.5px solid rgba(255, 255, 255, 0.1)",
    borderTopColor: "var(--color-plum-voltage)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  retryBtn: {
    fontFamily: "var(--font-acronym)",
    marginTop: "8px",
    padding: "8px 20px",
    background: "transparent",
    border: "1.5px solid #ff4a4a",
    borderRadius: "var(--radius-buttons)",
    color: "#ff4a4a",
    fontSize: "12px",
    cursor: "pointer",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    width: "100%",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
    },
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "var(--card-padding)",
    background: "transparent",
    borderRadius: "var(--radius-cards)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  featureLabel: {
    fontFamily: "var(--font-acronym)",
    fontSize: "13px",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-bone)",
    marginBottom: "4px",
  },
  featureDesc: {
    fontSize: "12px",
    lineHeight: "1.4",
    color: "var(--color-smoke)",
  },
};