import React, { useState } from "react";
import SourceChips from "./SourceChips.jsx";

/**
 * Renders a single chat message — user or assistant.
 * Assistant messages support basic markdown:
 *   **bold**, `code`, ```code blocks```, bullet points, numbered lists.
 */
export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.wrapperUser : styles.wrapperAssistant) }}>
      {/* Avatar */}
      <div style={{ ...styles.avatar, ...(isUser ? styles.avatarUser : styles.avatarAssistant) }}>
        {isUser ? "U" : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect width="14" height="14" rx="4" fill="rgba(200,180,250,0.2)" />
            <path d="M3 4h8M3 7h6M3 10h7" stroke="#c8b4fa" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        ...styles.bubble,
        ...(isUser ? styles.bubbleUser : styles.bubbleAssistant),
        ...(isError ? styles.bubbleError : {}),
      }}>
        {isUser ? (
          <p style={styles.userText}>{message.content}</p>
        ) : (
          <div style={styles.assistantContent}>
            <MarkdownRenderer text={message.content} />
            {message.sources && message.sources.length > 0 && (
              <SourceChips sources={message.sources} />
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <p style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer — handles the most common patterns
 * without needing an external library.
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (```)
    if (line.trimStart().startsWith("```")) {
      const lang = line.replace(/```/, "").trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} style={styles.codeBlock}>
          {lang && <span style={styles.codeLang}>{lang}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Heading (### or ##)
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={styles.h3}>{inlineFormat(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={styles.h2}>{inlineFormat(line.slice(3))}</h2>);
      i++; continue;
    }

    // Bullet list (- or *)
    if (/^(\s*[-*])\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^(\s*[-*])\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} style={styles.ul}>
          {items.map((item, j) => (
            <li key={j} style={styles.li}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={styles.ol}>
          {items.map((item, j) => (
            <li key={j} style={styles.li}>{inlineFormat(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} style={styles.hr} />);
      i++; continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "8px" }} />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={key++} style={styles.p}>{inlineFormat(line)}</p>);
    i++;
  }

  return <div>{elements}</div>;
}

/**
 * Process inline formatting: **bold**, *italic*, `code`, within a line.
 */
function inlineFormat(text) {
  // Split on **bold**, *italic*, `code` patterns
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index} style={styles.bold}>{match[2]}</strong>);
    } else if (match[0].startsWith("*")) {
      parts.push(<em key={match.index} style={styles.italic}>{match[3]}</em>);
    } else if (match[0].startsWith("`")) {
      parts.push(<code key={match.index} style={styles.inlineCode}>{match[4]}</code>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

const styles = {
  wrapper: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    animation: "fadeUp 0.3s ease both",
  },
  wrapperUser: {
    flexDirection: "row-reverse",
  },
  wrapperAssistant: {
    flexDirection: "row",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "600",
    flexShrink: 0,
    marginTop: "2px",
    fontFamily: "var(--font-mono)",
  },
  avatarUser: {
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid rgba(200,180,250,0.2)",
  },
  avatarAssistant: {
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: "14px",
    padding: "12px 16px",
    lineHeight: "1.65",
  },
  bubbleUser: {
    background: "var(--accent-dim)",
    border: "1px solid rgba(200,180,250,0.2)",
    borderTopRightRadius: "4px",
  },
  bubbleAssistant: {
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderTopLeftRadius: "4px",
  },
  bubbleError: {
    background: "rgba(255,107,107,0.08)",
    border: "1px solid rgba(255,107,107,0.2)",
  },
  userText: {
    color: "var(--accent)",
    fontSize: "14px",
    margin: 0,
  },
  assistantContent: {
    color: "var(--text-primary)",
    fontSize: "14px",
  },
  timestamp: {
    fontSize: "10px",
    color: "var(--text-muted)",
    marginTop: "6px",
    textAlign: "right",
    fontFamily: "var(--font-mono)",
  },
  // Markdown styles
  p: {
    margin: "0 0 6px 0",
    fontSize: "14px",
    color: "var(--text-primary)",
  },
  h2: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "17px",
    color: "var(--text-primary)",
    margin: "10px 0 6px 0",
    fontWeight: "normal",
  },
  h3: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--accent)",
    margin: "10px 0 4px 0",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontFamily: "var(--font-mono)",
  },
  ul: {
    margin: "4px 0 8px 0",
    paddingLeft: "18px",
  },
  ol: {
    margin: "4px 0 8px 0",
    paddingLeft: "18px",
  },
  li: {
    fontSize: "14px",
    color: "var(--text-primary)",
    marginBottom: "4px",
    lineHeight: "1.6",
  },
  bold: {
    color: "var(--text-primary)",
    fontWeight: "600",
  },
  italic: {
    fontStyle: "italic",
    color: "var(--text-secondary)",
  },
  inlineCode: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    background: "var(--bg-4)",
    color: "var(--accent)",
    padding: "1px 5px",
    borderRadius: "4px",
    border: "1px solid var(--border)",
  },
  codeBlock: {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 14px",
    margin: "8px 0",
    overflowX: "auto",
    position: "relative",
  },
  codeLang: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  hr: {
    border: "none",
    borderTop: "1px solid var(--border)",
    margin: "10px 0",
  },
};