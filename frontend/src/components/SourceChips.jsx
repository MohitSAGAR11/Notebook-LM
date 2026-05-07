import React, { useState } from "react";

export default function SourceChips({ sources }) {
  const [expanded, setExpanded] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 5 }}>
          <circle cx="6" cy="6" r="5" stroke="var(--green)" strokeWidth="1.2" />
          <path d="M4 6l1.5 1.5L8 4" stroke="var(--green)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Grounded in {sources.length} chunk{sources.length > 1 ? "s" : ""}
      </p>
      <div style={styles.chips}>
        {sources.map((src, i) => (
          <div key={i}>
            <button
              style={{
                ...styles.chip,
                ...(expanded === i ? styles.chipActive : {}),
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span style={styles.chipIndex}>#{src.chunkIndex + 1}</span>
              <span style={styles.chipScore}>{(src.score * 100).toFixed(0)}%</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  marginLeft: "auto",
                  transition: "transform 0.2s",
                  transform: expanded === i ? "rotate(180deg)" : "none",
                  opacity: 0.4,
                }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {expanded === i && (
              <div style={styles.preview} className="fade-in">
                <p style={styles.previewSource}>{src.source}</p>
                <p style={styles.previewText}>{src.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    color: "var(--green)",
    display: "flex",
    alignItems: "center",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  chips: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    background: "var(--green-dim)",
    border: "1px solid rgba(109, 232, 176, 0.15)",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    transition: "all 0.15s ease",
  },
  chipActive: {
    background: "rgba(109, 232, 176, 0.15)",
    borderColor: "rgba(109, 232, 176, 0.3)",
    color: "var(--text-primary)",
  },
  chipIndex: {
    color: "var(--green)",
    fontWeight: "500",
  },
  chipScore: {
    marginLeft: "auto",
    color: "var(--text-muted)",
  },
  preview: {
    padding: "10px 12px",
    background: "var(--bg)",
    borderRadius: "0 0 6px 6px",
    border: "1px solid rgba(109, 232, 176, 0.1)",
    borderTop: "none",
    marginTop: "-2px",
  },
  previewSource: {
    fontSize: "10px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    marginBottom: "4px",
  },
  previewText: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    fontStyle: "italic",
  },
};