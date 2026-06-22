import React from "react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const isError = message.isError;

  return (
    <div style={{ ...styles.wrapper, ...(isUser ? styles.wrapperUser : styles.wrapperAssistant) }}>
      <div style={{ ...styles.avatar, ...(isUser ? styles.avatarUser : styles.avatarAssistant) }}>
        {isUser ? "U" : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-bone)" strokeWidth="2">
            <path d="M12 2L2 12l10 10 10-10L12 2z" />
          </svg>
        )}
      </div>

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
          </div>
        )}

        {message.timestamp && (
          <p style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

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

    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={styles.h3}>{inlineFormat(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={styles.h2}>{inlineFormat(line.slice(3))}</h2>);
      i++; continue;
    }

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

    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={key++} style={styles.hr} />);
      i++; continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "6px" }} />);
      i++; continue;
    }

    elements.push(<p key={key++} style={styles.p}>{inlineFormat(line)}</p>);
    i++;
  }

  return <div>{elements}</div>;
}

function inlineFormat(text) {
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
    gap: "12px",
    marginBottom: "18px",
    animation: "fadeUp 0.3s ease both",
  },
  wrapperUser: {
    flexDirection: "row-reverse",
  },
  wrapperAssistant: {
    flexDirection: "row",
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "var(--font-weight-semibold)",
    flexShrink: 0,
    marginTop: "2px",
  },
  avatarUser: {
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "var(--color-bone)",
    background: "transparent",
  },
  avatarAssistant: {
    background: "var(--color-plum-voltage)",
    color: "var(--color-bone)",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: "var(--radius-cards)",
    padding: "16px 20px",
    lineHeight: "1.5",
  },
  bubbleUser: {
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "var(--color-bone)",
  },
  bubbleAssistant: {
    background: "transparent",
    border: "1px solid var(--color-plum-voltage)",
    color: "var(--color-bone)",
  },
  bubbleError: {
    border: "1px solid #ff4a4a",
  },
  userText: {
    fontSize: "14px",
    margin: 0,
  },
  assistantContent: {
    fontSize: "14px",
  },
  timestamp: {
    fontSize: "10px",
    color: "var(--color-smoke)",
    marginTop: "6px",
    textAlign: "right",
    fontFamily: "var(--font-mono)",
  },
  p: {
    margin: "0 0 6px 0",
    fontSize: "14px",
    color: "var(--color-bone)",
  },
  h2: {
    fontFamily: "var(--font-acronym)",
    fontSize: "17px",
    color: "var(--color-bone)",
    margin: "12px 0 6px 0",
    fontWeight: "var(--font-weight-semibold)",
  },
  h3: {
    fontFamily: "var(--font-acronym)",
    fontSize: "13px",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-plum-voltage)",
    margin: "10px 0 4px 0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
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
    color: "var(--color-bone)",
    marginBottom: "4px",
    lineHeight: "1.5",
  },
  bold: {
    color: "var(--color-bone)",
    fontWeight: "var(--font-weight-semibold)",
  },
  italic: {
    fontStyle: "italic",
    color: "var(--color-ash)",
  },
  inlineCode: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--color-bone)",
    padding: "1px 5px",
    borderRadius: "4px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  codeBlock: {
    background: "#0c0c0e",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "var(--radius-cards)",
    padding: "12px 14px",
    margin: "8px 0",
    overflowX: "auto",
    position: "relative",
  },
  codeLang: {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "var(--color-smoke)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  hr: {
    border: "none",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    margin: "12px 0",
  },
};