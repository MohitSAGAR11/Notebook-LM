import React, { useState, useEffect, useRef } from "react";
import UploadZone from "./components/UploadZone";
import SourceChips from "./components/SourceChips";

const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [docData, setDocData] = useState(null); // { docId, fileName, chunkCount }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userQuestion = input.trim();
    setInput("");
    
    // Add user message to UI
    const newMessages = [...messages, { role: "user", content: userQuestion }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docData.docId,
          question: userQuestion,
          history: messages.slice(-5), // Send last few messages for context
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add AI response to UI
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I encountered an error: ${err.message}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Render Upload View ──────────────────────────────────────────────────
  if (!docData) {
    return (
      <div style={styles.container}>
        <UploadZone onDocumentReady={(data) => setDocData(data)} />
      </div>
    );
  }

  // ─── Render Chat View ────────────────────────────────────────────────────
  return (
    <div style={styles.chatContainer} className="fade-in">
      {/* Sidebar / Doc Info */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.docIcon}>📄</div>
          <div style={{ overflow: "hidden" }}>
            <p style={styles.docName}>{docData.fileName}</p>
            <p style={styles.docMeta}>{docData.chunkCount} Chunks Indexed</p>
          </div>
        </div>
        <button style={styles.resetBtn} onClick={() => window.location.reload()}>
          Upload New Document
        </button>
      </aside>

      {/* Main Chat Area */}
      <main style={styles.main}>
        <div style={styles.messagesList}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <h2 style={styles.emptyTitle}>Ready to analyze</h2>
              <p style={styles.emptySub}>Ask a specific question about the document above.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={msg.role === "user" ? styles.userMsgRow : styles.botMsgRow}>
              <div style={msg.role === "user" ? styles.userBubble : styles.botBubble}>
                <div style={styles.msgContent}>{msg.content}</div>
                {msg.sources && <SourceChips sources={msg.sources} />}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={styles.botMsgRow}>
              <div style={styles.botBubble}>
                <div style={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form style={styles.inputArea} onSubmit={handleSendMessage}>
          <input
            style={styles.input}
            placeholder="Ask a question about this document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" style={styles.sendBtn} disabled={!input.trim() || isTyping}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}

const styles = {
  container: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatContainer: {
    display: "flex",
    height: "100%",
    background: "var(--bg)",
  },
  sidebar: {
    width: "280px",
    borderRight: "1px solid var(--border)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    background: "var(--bg-2)",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "var(--bg-3)",
    borderRadius: "12px",
    border: "1px solid var(--border)",
  },
  docIcon: { fontSize: "20px" },
  docName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  docMeta: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" },
  resetBtn: {
    padding: "10px",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  messagesList: {
    flex: 1,
    overflowY: "auto",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  userMsgRow: { display: "flex", justifyContent: "flex-end" },
  botMsgRow: { display: "flex", justifyContent: "flex-start" },
  userBubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    background: "var(--accent)",
    color: "#000",
    borderRadius: "18px 18px 2px 18px",
    fontSize: "14px",
    fontWeight: "500",
  },
  botBubble: {
    maxWidth: "85%",
    padding: "16px",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "18px 18px 18px 2px",
    fontSize: "14px",
    color: "var(--text-primary)",
    lineHeight: "1.6",
  },
  inputArea: {
    padding: "24px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    gap: "12px",
    background: "var(--bg)",
  },
  input: {
    flex: 1,
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    background: "var(--accent)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#000",
  },
  emptyState: {
    margin: "auto",
    textAlign: "center",
    opacity: 0.5,
  },
  emptyTitle: { fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "24px" },
  emptySub: { fontSize: "14px", marginTop: "8px" },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
    "& span": {
      width: "6px",
      height: "6px",
      background: "var(--text-muted)",
      borderRadius: "50%",
      animation: "blink 1.4s infinite both",
    }
  }
};