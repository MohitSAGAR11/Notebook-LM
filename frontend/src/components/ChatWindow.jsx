import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble.jsx";

const API = import.meta.env.VITE_API_URL || "";

export default function ChatWindow({ doc, onReset }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `I've read **${doc.fileName}** — ${doc.chunkCount} chunks indexed and ready.\n\nAsk me anything about this document.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { role: "user", content: question, timestamp: Date.now() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: doc.docId,
          question,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get answer.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Something went wrong: ${err.message}`,
          isError: true,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    if (window.confirm("Upload a new document? This will clear the current chat.")) {
      onReset();
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.docIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M9 1v3h3" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M5 6h4M5 8.5h4M5 11h2" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <div>
            <p style={styles.docName}>{doc.fileName}</p>
            <p style={styles.docMeta}>{doc.chunkCount} chunks · all-MiniLM-L6-v2 · Pinecone</p>
          </div>
        </div>
        <button style={styles.resetBtn} onClick={handleReset} title="Upload new document">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5A5.5 5.5 0 0 1 10.5 2.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M12 6.5A5.5 5.5 0 0 1 2.5 10.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M8.5 1l2 1.5-1.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 12L2.5 10.7l1.5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New doc
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={styles.loadingWrapper} className="fade-in">
            <div style={styles.loadingAvatar}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect width="14" height="14" rx="4" fill="rgba(200,180,250,0.2)" />
                <path d="M3 4h8M3 7h6M3 10h7" stroke="#c8b4fa" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={styles.loadingBubble}>
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — only shown at start */}
      {messages.length === 1 && (
        <div style={styles.suggestions} className="fade-in">
          {[
            "Summarize this document",
            "What are the key concepts?",
            "What problems does this address?",
            "List the main takeaways",
          ].map((q) => (
            <button
              key={q}
              style={styles.suggestion}
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={styles.inputBar}>
        <textarea
          ref={inputRef}
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the document..."
          rows={1}
          disabled={loading}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...((!input.trim() || loading) ? styles.sendBtnDisabled : {}),
          }}
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          title="Send (Enter)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <p style={styles.hint}>Enter to send · Shift+Enter for new line</p>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            ...styles.dot,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxWidth: "780px",
    margin: "0 auto",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-2)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  docIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "var(--accent-dim)",
    border: "1px solid rgba(200,180,250,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-primary)",
    maxWidth: "340px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    margin: 0,
  },
  docMeta: {
    fontSize: "11px",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    margin: 0,
    marginTop: "1px",
  },
  resetBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.15s ease",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px 8px",
  },
  loadingWrapper: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  loadingAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  loadingBubble: {
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    borderTopLeftRadius: "4px",
    padding: "12px 16px",
  },
  dots: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
    height: "18px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--accent)",
    display: "inline-block",
    animation: "dotBounce 1.2s ease-in-out infinite",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "0 20px 14px",
  },
  suggestion: {
    padding: "7px 13px",
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.15s ease",
  },
  inputBar: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    padding: "12px 20px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-2)",
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
    lineHeight: "1.5",
    resize: "none",
    outline: "none",
    minHeight: "42px",
    maxHeight: "140px",
    overflowY: "auto",
    transition: "border-color 0.15s ease",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "var(--accent)",
    border: "none",
    color: "var(--bg)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  sendBtnDisabled: {
    background: "var(--bg-4)",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  },
  hint: {
    textAlign: "center",
    fontSize: "11px",
    color: "var(--text-muted)",
    padding: "4px 0 10px",
    fontFamily: "var(--font-mono)",
  },
};