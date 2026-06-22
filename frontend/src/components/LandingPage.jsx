import { useEffect, useRef } from "react";

function CanvasConstellation({ density = "comfortable" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const colors = ["#8052ff", "#ffb829", "#15846e", "#ffffff"];
    const shapes = ["circle", "triangle", "diamond", "square"];

    const particleCount = density === "comfortable" ? 180 : 60;
    const particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 4 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = shapes[Math.floor(Math.random() * shapes.length)];
        this.alpha = init ? Math.random() : 0;
        this.fadeSpeed = Math.random() * 0.02 + 0.005;
        this.targetX = width / 2;
        this.targetY = height / 2;
      }

      update(mouseX, mouseY, hasMouse) {
        this.x += this.vx;
        this.y += this.vy;

        const tx = hasMouse ? mouseX : this.targetX;
        const ty = hasMouse ? mouseY : this.targetY;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 15) {
          const force = 0.00008;
          this.vx += dx * force;
          this.vy += dy * force;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 1.0;
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }

        if (this.alpha < 1) {
          this.alpha += this.fadeSpeed;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha * 0.65;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        if (this.shape === "circle") {
          ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.shape === "triangle") {
          const h = this.size * (Math.sqrt(3) / 2);
          ctx.moveTo(this.x, this.y - h / 2);
          ctx.lineTo(this.x - this.size / 2, this.y + h / 2);
          ctx.lineTo(this.x + this.size / 2, this.y + h / 2);
          ctx.closePath();
          ctx.fill();
        } else if (this.shape === "diamond") {
          ctx.moveTo(this.x, this.y - this.size / 2);
          ctx.lineTo(this.x + this.size / 2, this.y);
          ctx.lineTo(this.x, this.y + this.size / 2);
          ctx.lineTo(this.x - this.size / 2, this.y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let mouseX = 0;
    let mouseY = 0;
    let hasMouse = false;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      hasMouse = true;
    };

    const handleMouseLeave = () => {
      hasMouse = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      particles.forEach(p => {
        p.targetX = width / 2;
        p.targetY = height / 2;
      });
    };
    window.addEventListener("resize", handleResize);

    const loop = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update(mouseX, mouseY, hasMouse);
        p.draw();
      });

      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 70) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [density]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export default function LandingPage({ onLaunch }) {
  return (
    <div style={styles.page}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-plum-voltage)" strokeWidth="1.5" style={{ marginRight: "8px" }}>
            <path d="M12 2L2 12l10 10 10-10L12 2zM12 2v20" />
          </svg>
          <span style={styles.logoText}>Notebook-LLM</span>
        </div>
        <div style={styles.navCenter}>
          <a href="#workflow" style={styles.navLink}>WORKFLOW</a>
          <a href="#features" style={styles.navLink}>FEATURES</a>
          <a href="#tech" style={styles.navLink}>TECH STACK</a>
        </div>
        <div style={styles.navRight}>
          <button style={styles.navCTA} onClick={onLaunch}>
            LAUNCH APP
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.heroSection}>
        <div style={styles.heroLeft}>
          <span style={styles.eyebrow}>RETRIEVAL-AUGMENTED GENERATION APPLICATION</span>
          <h1 style={styles.heroTitle}>Chat with your<br />documents.</h1>
          <p style={styles.heroDesc}>
            Notebook-LLM is a full RAG pipeline that lets you upload PDF and TXT documents, extract their content, and query them using query expansion, similarity search, and cross-encoder reranking for grounded, hallucination-free answers.
          </p>
          <button style={styles.primaryButton} onClick={onLaunch}>
            LAUNCH APPLICATION
          </button>
        </div>
        <div style={styles.heroRight}>
          <CanvasConstellation density="comfortable" />
        </div>
      </header>

      {/* Ingestion & Querying Workflow */}
      <section id="workflow" style={styles.overviewSection}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={styles.eyebrowAccent}>SYSTEM WORKFLOW</span>
            <h2 style={styles.sectionTitle}>Document Ingestion & Querying Pipeline</h2>
            <p style={styles.overviewText}>
              A comprehensive view of how Notebook-LLM processes files page-by-page and conducts multi-query retrieval.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
              <span style={{ fontSize: "18px", color: "var(--color-plum-voltage)", fontWeight: "bold" }}>01</span>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px", color: "var(--color-bone)" }}>Ingestion & PDF Parsing</h4>
                <p style={{ fontSize: "13px", color: "var(--color-smoke)", lineHeight: "1.4" }}>
                  Upload a PDF or <code>.txt</code> file. Text is extracted from PDFs page-by-page using <code>pdfjs-dist</code> to optimize server memory usage.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
              <span style={{ fontSize: "18px", color: "var(--color-plum-voltage)", fontWeight: "bold" }}>02</span>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px", color: "var(--color-bone)" }}>Recursive Chunking</h4>
                <p style={{ fontSize: "13px", color: "var(--color-smoke)", lineHeight: "1.4" }}>
                  A Custom Recursive Character Splitter divides text into 800-character chunks with a 150-character overlap. It splits recursively on paragraphs, newlines, sentences, and spaces to preserve natural context, attaching source metadata to each block.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
              <span style={{ fontSize: "18px", color: "var(--color-plum-voltage)", fontWeight: "bold" }}>03</span>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px", color: "var(--color-bone)" }}>Embedding & Namespace Storage</h4>
                <p style={{ fontSize: "13px", color: "var(--color-smoke)", lineHeight: "1.4" }}>
                  Chunks are embedded in parallel batches using LangChain's Hugging Face Inference integration with the <code>sentence-transformers/all-MiniLM-L6-v2</code> model. Embeddings are stored in a dedicated document-level namespace in a Pinecone serverless index to guarantee clean isolation.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px", color: "var(--color-plum-voltage)", fontWeight: "bold" }}>04</span>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px", color: "var(--color-bone)" }}>Retrieval & Grounded Synthesis</h4>
                <p style={{ fontSize: "13px", color: "var(--color-smoke)", lineHeight: "1.4" }}>
                  The query is expanded into 3 variants using <code>gpt-oss-120b</code>. A multi-query search returns the top 5 Pinecone matches per query, which are merged and reranked via a cross-encoder model. The top 5 reranked context blocks are formatted into a grounded prompt for generator execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.featuresHeader}>
          <span style={styles.eyebrowAccent}>ENGINEERED FOR ACCURACY</span>
          <h2 style={styles.featuresTitle}>Core Retrieval Features</h2>
        </div>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Query Expansion</h3>
            <p style={styles.cardDesc}>
              The original question is expanded into 3 variants (1 original + 2 rephrasings) using <code>gpt-oss-120b</code> via OpenRouter to maximize recall and match vectors across multiple phrasing styles.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>LLM Cross-Encoder Reranking</h3>
            <p style={styles.cardDesc}>
              Merged candidate chunks from similarity search (Top-K=5) are evaluated in parallel by <code>gpt-oss-120b</code> to grade relevance (0-10). High-scoring chunks are sorted (falling back to cosine similarity on ties) and the top 5 are selected.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Grounded Generation</h3>
            <p style={styles.cardDesc}>
              An LLM (<code>gpt-oss-120b:free</code> via OpenRouter) generates the final answer strictly adhering to the top 5 reranked context blocks at a low temperature of <code>0.1</code> to eliminate hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" style={styles.overviewSection}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <span style={styles.eyebrowAccent}>TECHNOLOGY STACK</span>
            <h2 style={styles.sectionTitle}>Built on Open-Source & Serverless Standards</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", textAlign: "left" }}>
            <div style={{ border: "1px solid rgba(255, 255, 255, 0.08)", padding: "24px", borderRadius: "24px" }}>
              <h4 style={{ color: "var(--color-plum-voltage)", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Backend Infrastructure</h4>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--color-smoke)" }}>
                <li>• <strong>Express</strong> - REST API server</li>
                <li>• <strong>Multer</strong> - File upload handling</li>
                <li>• <strong>pdfjs-dist</strong> - Memory-optimized page-by-page PDF parsing</li>
                <li>• <strong>Pinecone Client</strong> - Namespace database storage</li>
              </ul>
            </div>
            <div style={{ border: "1px solid rgba(255, 255, 255, 0.08)", padding: "24px", borderRadius: "24px" }}>
              <h4 style={{ color: "var(--color-plum-voltage)", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>AI & Embeddings Integration</h4>
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--color-smoke)" }}>
                <li>• <strong>LangChain Community</strong> - Embedding integration</li>
                <li>• <strong>Hugging Face Inference</strong> - sentence-transformers/all-MiniLM-L6-v2</li>
                <li>• <strong>OpenRouter client</strong> - gpt-oss-120b access for generation & reranking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>Chat with your documents.</h2>
          <p style={styles.ctaDesc}>
            Upload a PDF or TXT document and get grounded answers instantly.
          </p>
          <button style={styles.primaryButton} onClick={onLaunch}>
            LAUNCH APPLICATION
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2026 Notebook-LLM RAG System. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    background: "var(--color-void)",
    color: "var(--color-bone)",
    minHeight: "100%",
    width: "100%",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    height: "72px",
    maxWidth: "var(--page-max-width)",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
  },
  logoText: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "18px",
    letterSpacing: "0.02em",
    color: "var(--color-bone)",
  },
  navCenter: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
    marginRight: "auto",
    marginLeft: "48px",
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  navLink: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "13px",
    letterSpacing: "0.05em",
    color: "var(--color-smoke)",
    textDecoration: "none",
    transition: "color 0.15s ease",
    ":hover": {
      color: "var(--color-bone)",
    },
  },
  navRight: {
    display: "flex",
    alignItems: "center",
  },
  navCTA: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "12px",
    letterSpacing: "0.05em",
    background: "transparent",
    border: "1px stroke var(--color-plum-voltage)",
    outline: "none",
    color: "var(--color-bone)",
    borderRadius: "var(--radius-buttons)",
    padding: "10px 18px",
    cursor: "pointer",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "var(--color-plum-voltage)",
    transition: "background 0.2s ease",
  },
  heroSection: {
    maxWidth: "var(--page-max-width)",
    width: "100%",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    padding: "var(--section-gap) 24px",
    alignItems: "center",
    gap: "48px",
    minHeight: "560px",
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    maxWidth: "480px",
  },
  eyebrow: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "12px",
    letterSpacing: "0.05em",
    color: "var(--color-bone)",
    marginBottom: "12px",
  },
  eyebrowAccent: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "12px",
    letterSpacing: "0.05em",
    color: "var(--color-plum-voltage)",
    marginBottom: "12px",
    display: "inline-block",
  },
  heroTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-extralight)",
    fontSize: "var(--text-display)",
    lineHeight: "var(--leading-display)",
    letterSpacing: "var(--tracking-display)",
    color: "var(--color-bone)",
    marginBottom: "24px",
  },
  heroDesc: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "16px",
    lineHeight: "1.5",
    letterSpacing: "0.025em",
    color: "var(--color-ash)",
    marginBottom: "36px",
  },
  primaryButton: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "12px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    background: "var(--color-plum-voltage)",
    border: "none",
    outline: "none",
    color: "var(--color-bone)",
    borderRadius: "var(--radius-buttons)",
    padding: "14px 28px",
    cursor: "pointer",
    transition: "filter 0.2s ease",
  },
  heroRight: {
    height: "100%",
    minHeight: "400px",
    position: "relative",
    borderRadius: "var(--radius-cards)",
    overflow: "hidden",
  },
  overviewSection: {
    background: "#000000",
    padding: "var(--section-gap) 24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  overviewContainer: {
    maxWidth: "680px",
    margin: "0 auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  outlineIconWrapper: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-extralight)",
    fontSize: "var(--text-heading)",
    color: "var(--color-bone)",
    marginBottom: "18px",
    letterSpacing: "-0.01em",
  },
  overviewText: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "16px",
    lineHeight: "1.6",
    color: "var(--color-ash)",
  },
  featuresSection: {
    maxWidth: "var(--page-max-width)",
    width: "100%",
    margin: "0 auto",
    padding: "var(--section-gap) 24px",
  },
  featuresHeader: {
    marginBottom: "36px",
  },
  featuresTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-extralight)",
    fontSize: "var(--text-heading)",
    color: "var(--color-bone)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "var(--radius-cards)",
    padding: "var(--card-padding)",
    background: "transparent",
  },
  cardTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: "var(--text-subheading)",
    color: "var(--color-bone)",
    marginBottom: "12px",
  },
  cardDesc: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "var(--text-body-sm)",
    lineHeight: "1.5",
    color: "var(--color-smoke)",
  },
  ctaSection: {
    padding: "var(--section-gap) 24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  ctaContainer: {
    maxWidth: "600px",
    margin: "0 auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  ctaTitle: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-extralight)",
    fontSize: "var(--text-heading)",
    color: "var(--color-bone)",
    marginBottom: "12px",
  },
  ctaDesc: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "15px",
    color: "var(--color-ash)",
    marginBottom: "24px",
  },
  footer: {
    marginTop: "auto",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "24px",
    textAlign: "center",
  },
  footerText: {
    fontFamily: "var(--font-acronym)",
    fontWeight: "var(--font-weight-regular)",
    fontSize: "12px",
    color: "var(--color-smoke)",
  },
};
