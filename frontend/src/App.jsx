import React, { useState, useEffect, useRef } from "react";
import UploadZone from "./components/UploadZone";
import MessageBubble from "./components/MessageBubble";
import LandingPage from "./components/LandingPage";

const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [view, setView] = useState("landing");
  const [docData, setDocData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userQuestion = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user", content: userQuestion, timestamp: Date.now() }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docData.docId,
          question: userQuestion,
          history: messages.slice(-5),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources, timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I encountered an error: ${err.message}`, isError: true, timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (view === "landing") {
    return <LandingPage onLaunch={() => setView("app")} />;
  }

  if (!docData) {
    return (
      <div style={styles.container}>
        <UploadZone onDocumentReady={(data) => setDocData(data)} />
      </div>
    );
  }

  return (
    <div style={styles.chatContainer} className="fade-in">
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.docIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-plum-voltage)" strokeWidth="1.5">
              <path d="M12 2L2 12l10 10 10-10L12 2z" />
            </svg>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={styles.docName}>{docData.fileName}</p>
            <p style={styles.docMeta}>{docData.chunkCount} segments</p>
          </div>
        </div>

        <div style={styles.pipelineInfo}>
          <p style={styles.pipelineTitle}>RAG Architecture</p>
          {[
            { label: "Splitter", value: "Recursive Chunker" },
            { label: "Embedder", value: "MiniLM-L6-v2" },
            { label: "Vector DB", value: "Pinecone Serverless" },
            { label: "Generator", value: "GPT-OSS-120B" },
          ].map((item) => (
            <div key={item.label} style={styles.pipelineRow}>
              <span style={styles.pipelineLabel}>{item.label}</span>
              <span style={styles.pipelineValue}>{item.value}</span>
            </div>
          ))}
        </div>

        <button style={styles.resetBtn} onClick={() => { setDocData(null); setMessages([]); }}>
          New Document
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.messagesList}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <h2 style={styles.emptyTitle}>Ready to analyze</h2>
              <p style={styles.emptySub}>Ask anything about <em>{docData.fileName}</em></p>
              <div style={styles.suggestions}>
                {["Summarize this document", "What are the key concepts?", "List the main takeaways"].map((q) => (
                  <button key={q} style={styles.suggestion} onClick={() => setInput(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isTyping && (
            <div style={styles.botMsgRow}>
              <div style={styles.botBubble}>
                <div style={styles.typingDots}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form style={styles.inputArea} onSubmit={handleSendMessage}>
          <input
            style={styles.input}
            placeholder="Ask a question about this document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" style={{
            ...styles.sendBtn,
            ...(!input.trim() || isTyping ? styles.sendBtnDisabled : {})
          }} disabled={!input.trim() || isTyping}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </main>

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
  container: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-void)",
  },
  chatContainer: {
    display: "flex",
    height: "100%",
    background: "var(--color-void)",
  },
  sidebar: {
    width: "280px",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    background: "var(--color-void)",
    flexShrink: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "transparent",
    borderRadius: "var(--radius-cards)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  docIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docName: {
    fontFamily: "var(--font-acronym)",
    fontSize: "13px",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-bone)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
  },
  docMeta: {
    fontSize: "11px",
    color: "var(--color-smoke)",
    marginTop: "2px",
    fontFamily: "var(--font-mono)",
    margin: 0,
  },
  pipelineInfo: {
    padding: "16px",
    background: "transparent",
    borderRadius: "var(--radius-cards)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  pipelineTitle: {
    fontFamily: "var(--font-acronym)",
    fontSize: "11px",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-bone)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
  },
  pipelineRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pipelineLabel: {
    fontSize: "12px",
    color: "var(--color-smoke)",
  },
  pipelineValue: {
    fontSize: "12px",
    color: "var(--color-plum-voltage)",
    fontWeight: "var(--font-weight-semibold)",
  },
  resetBtn: {
    fontFamily: "var(--font-acronym)",
    marginTop: "auto",
    padding: "12px",
    background: "transparent",
    border: "1.5px solid var(--color-plum-voltage)",
    color: "var(--color-bone)",
    borderRadius: "var(--radius-buttons)",
    fontSize: "12px",
    fontWeight: "var(--font-weight-semibold)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "var(--color-void)",
  },
  messagesList: {
    flex: 1,
    overflowY: "auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
  },
  emptyState: {
    margin: "auto",
    textAlign: "center",
    maxWidth: "480px",
  },
  emptyTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-extralight)",
    fontSize: "36px",
    color: "var(--color-bone)",
    marginBottom: "12px",
    letterSpacing: "-0.01em",
  },
  emptySub: {
    fontSize: "15px",
    color: "var(--color-smoke)",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  suggestion: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "var(--radius-buttons)",
    color: "var(--color-ash)",
    fontSize: "13px",
    cursor: "pointer",
    width: "100%",
    maxWidth: "320px",
    textAlign: "center",
    transition: "border-color 0.2s ease, color 0.2s ease",
  },
  botMsgRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "18px",
  },
  botBubble: {
    padding: "12px 16px",
    background: "transparent",
    border: "1px solid var(--color-plum-voltage)",
    borderRadius: "var(--radius-cards)",
  },
  typingDots: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    height: "18px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--color-plum-voltage)",
    display: "inline-block",
    animation: "dotBounce 1.2s ease-in-out infinite",
  },
  inputArea: {
    padding: "20px 24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    gap: "12px",
    background: "var(--color-void)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "var(--radius-buttons)",
    padding: "12px 20px",
    color: "var(--color-bone)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "var(--font-acronym)",
    transition: "border-color 0.2s ease",
  },
  sendBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "var(--color-plum-voltage)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--color-bone)",
    flexShrink: 0,
    transition: "opacity 0.2s ease",
  },
  sendBtnDisabled: {
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--color-smoke)",
    cursor: "not-allowed",
  },
};