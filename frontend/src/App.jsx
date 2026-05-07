// import React, { useState, useEffect, useRef } from "react";
// import UploadZone from "./components/UploadZone";
// import SourceChips from "./components/SourceChips";

// const API = import.meta.env.VITE_API_URL || "";

// export default function App() {
//   const [docData, setDocData] = useState(null); // { docId, fileName, chunkCount }
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const scrollRef = useRef(null);

//   // Auto-scroll to bottom of chat
//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isTyping]);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!input.trim() || isTyping) return;

//     const userQuestion = input.trim();
//     setInput("");
    
//     // Add user message to UI
//     const newMessages = [...messages, { role: "user", content: userQuestion }];
//     setMessages(newMessages);
//     setIsTyping(true);

//     try {
//       const res = await fetch(`${API}/api/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           docId: docData.docId,
//           question: userQuestion,
//           history: messages.slice(-5), // Send last few messages for context
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error);

//       // Add AI response to UI
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: data.answer, sources: data.sources },
//       ]);
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: `Sorry, I encountered an error: ${err.message}` },
//       ]);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   // ─── Render Upload View ──────────────────────────────────────────────────
//   if (!docData) {
//     return (
//       <div style={styles.container}>
//         <UploadZone onDocumentReady={(data) => setDocData(data)} />
//       </div>
//     );
//   }

//   // ─── Render Chat View ────────────────────────────────────────────────────
//   return (
//     <div style={styles.chatContainer} className="fade-in">
//       {/* Sidebar / Doc Info */}
//       <aside style={styles.sidebar}>
//         <div style={styles.sidebarHeader}>
//           <div style={styles.docIcon}>📄</div>
//           <div style={{ overflow: "hidden" }}>
//             <p style={styles.docName}>{docData.fileName}</p>
//             <p style={styles.docMeta}>{docData.chunkCount} Chunks Indexed</p>
//           </div>
//         </div>
//         <button style={styles.resetBtn} onClick={() => window.location.reload()}>
//           Upload New Document
//         </button>
//       </aside>

//       {/* Main Chat Area */}
//       <main style={styles.main}>
//         <div style={styles.messagesList}>
//           {messages.length === 0 && (
//             <div style={styles.emptyState}>
//               <h2 style={styles.emptyTitle}>Ready to analyze</h2>
//               <p style={styles.emptySub}>Ask a specific question about the document above.</p>
//             </div>
//           )}

//           {messages.map((msg, i) => (
//             <div key={i} style={msg.role === "user" ? styles.userMsgRow : styles.botMsgRow}>
//               <div style={msg.role === "user" ? styles.userBubble : styles.botBubble}>
//                 <div style={styles.msgContent}>{msg.content}</div>
//                 {msg.sources && <SourceChips sources={msg.sources} />}
//               </div>
//             </div>
//           ))}

//           {isTyping && (
//             <div style={styles.botMsgRow}>
//               <div style={styles.botBubble}>
//                 <div style={styles.typingIndicator}>
//                   <span></span><span></span><span></span>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={scrollRef} />
//         </div>

//         {/* Input Bar */}
//         <form style={styles.inputArea} onSubmit={handleSendMessage}>
//           <input
//             style={styles.input}
//             placeholder="Ask a question about this document..."
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             autoFocus
//           />
//           <button type="submit" style={styles.sendBtn} disabled={!input.trim() || isTyping}>
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
//             </svg>
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     height: "100%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   chatContainer: {
//     display: "flex",
//     height: "100%",
//     background: "var(--bg)",
//   },
//   sidebar: {
//     width: "280px",
//     borderRight: "1px solid var(--border)",
//     padding: "24px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "20px",
//     background: "var(--bg-2)",
//   },
//   sidebarHeader: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     padding: "12px",
//     background: "var(--bg-3)",
//     borderRadius: "12px",
//     border: "1px solid var(--border)",
//   },
//   docIcon: { fontSize: "20px" },
//   docName: {
//     fontSize: "13px",
//     fontWeight: "600",
//     color: "var(--text-primary)",
//     whiteSpace: "nowrap",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//   },
//   docMeta: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" },
//   resetBtn: {
//     padding: "10px",
//     background: "transparent",
//     border: "1px solid var(--border)",
//     color: "var(--text-secondary)",
//     borderRadius: "8px",
//     fontSize: "12px",
//     cursor: "pointer",
//     transition: "all 0.2s",
//   },
//   main: {
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     position: "relative",
//   },
//   messagesList: {
//     flex: 1,
//     overflowY: "auto",
//     padding: "40px 20px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "24px",
//   },
//   userMsgRow: { display: "flex", justifyContent: "flex-end" },
//   botMsgRow: { display: "flex", justifyContent: "flex-start" },
//   userBubble: {
//     maxWidth: "80%",
//     padding: "12px 16px",
//     background: "var(--accent)",
//     color: "#000",
//     borderRadius: "18px 18px 2px 18px",
//     fontSize: "14px",
//     fontWeight: "500",
//   },
//   botBubble: {
//     maxWidth: "85%",
//     padding: "16px",
//     background: "var(--bg-2)",
//     border: "1px solid var(--border)",
//     borderRadius: "18px 18px 18px 2px",
//     fontSize: "14px",
//     color: "var(--text-primary)",
//     lineHeight: "1.6",
//   },
//   inputArea: {
//     padding: "24px",
//     borderTop: "1px solid var(--border)",
//     display: "flex",
//     gap: "12px",
//     background: "var(--bg)",
//   },
//   input: {
//     flex: 1,
//     background: "var(--bg-2)",
//     border: "1px solid var(--border)",
//     borderRadius: "12px",
//     padding: "12px 16px",
//     color: "var(--text-primary)",
//     fontSize: "14px",
//     outline: "none",
//   },
//   sendBtn: {
//     width: "45px",
//     height: "45px",
//     borderRadius: "12px",
//     background: "var(--accent)",
//     border: "none",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     cursor: "pointer",
//     color: "#000",
//   },
//   emptyState: {
//     margin: "auto",
//     textAlign: "center",
//     opacity: 0.5,
//   },
//   emptyTitle: { fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "24px" },
//   emptySub: { fontSize: "14px", marginTop: "8px" },
//   typingIndicator: {
//     display: "flex",
//     gap: "4px",
//     padding: "4px 0",
//     "& span": {
//       width: "6px",
//       height: "6px",
//       background: "var(--text-muted)",
//       borderRadius: "50%",
//       animation: "blink 1.4s infinite both",
//     }
//   }
// };

import React, { useState, useEffect, useRef } from "react";
import UploadZone from "./components/UploadZone";
import MessageBubble from "./components/MessageBubble";

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

  // ─── Upload View ─────────────────────────────────────────────────────────
  if (!docData) {
    return (
      <div style={styles.container}>
        <UploadZone onDocumentReady={(data) => setDocData(data)} />
      </div>
    );
  }

  // ─── Chat View ────────────────────────────────────────────────────────────
  return (
    <div style={styles.chatContainer} className="fade-in">
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.docIcon}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 1h7l4 4v10H3V1z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M10 1v4h4" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5 7h6M5 9.5h6M5 12h3" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={styles.docName}>{docData.fileName}</p>
            <p style={styles.docMeta}>{docData.chunkCount} chunks indexed</p>
          </div>
        </div>

        <div style={styles.pipelineInfo}>
          <p style={styles.pipelineTitle}>RAG Pipeline</p>
          {[
            { label: "Chunker", value: "Recursive · 800ch" },
            { label: "Embedder", value: "MiniLM-L6-v2" },
            { label: "Vector DB", value: "Pinecone" },
            { label: "Generator", value: "GPT-4.1-mini" },
          ].map((item) => (
            <div key={item.label} style={styles.pipelineRow}>
              <span style={styles.pipelineLabel}>{item.label}</span>
              <span style={styles.pipelineValue}>{item.value}</span>
            </div>
          ))}
        </div>

        <button style={styles.resetBtn} onClick={() => window.location.reload()}>
          Upload New Document
        </button>
      </aside>

      {/* Main Chat */}
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

          {/* MessageBubble handles markdown + SourceChips internally */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isTyping && (
            <div style={styles.botMsgRow}>
              <div style={styles.botBubble}>
                <div style={styles.typingDots}>
                  {[0,1,2].map((i) => (
                    <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.18}s` }} />
                  ))}
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
          <button type="submit" style={{
            ...styles.sendBtn,
            ...(!input.trim() || isTyping ? styles.sendBtnDisabled : {})
          }} disabled={!input.trim() || isTyping}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  },
  chatContainer: {
    display: "flex",
    height: "100%",
    background: "var(--bg)",
  },
  // ── Sidebar ──
  sidebar: {
    width: "260px",
    borderRight: "1px solid var(--border)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    background: "var(--bg-2)",
    flexShrink: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    background: "var(--bg-3)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
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
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
  },
  docMeta: {
    fontSize: "11px",
    color: "var(--text-muted)",
    marginTop: "2px",
    fontFamily: "var(--font-mono)",
    margin: 0,
  },
  pipelineInfo: {
    padding: "12px",
    background: "var(--bg-3)",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  pipelineTitle: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "2px",
  },
  pipelineRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pipelineLabel: {
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  pipelineValue: {
    fontSize: "11px",
    color: "var(--accent)",
    fontFamily: "var(--font-mono)",
  },
  resetBtn: {
    marginTop: "auto",
    padding: "10px",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
  // ── Chat ──
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
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
  },
  emptyTitle: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "26px",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  emptySub: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    marginBottom: "20px",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  suggestion: {
    padding: "7px 14px",
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
  botMsgRow: { display: "flex", justifyContent: "flex-start", marginBottom: "20px" },
  botBubble: {
    padding: "12px 16px",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    borderTopLeftRadius: "4px",
  },
  typingDots: { display: "flex", gap: "5px", alignItems: "center", height: "18px" },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--accent)",
    display: "inline-block",
    animation: "dotBounce 1.2s ease-in-out infinite",
  },
  // ── Input ──
  inputArea: {
    padding: "16px 24px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    gap: "10px",
    background: "var(--bg)",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "11px 16px",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "var(--font-body)",
  },
  sendBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "var(--accent)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#0c0c0e",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    background: "var(--bg-4)",
    color: "var(--text-muted)",
    cursor: "not-allowed",
  },
};