import React, { useEffect, useRef } from "react";

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
          <span style={styles.logoText}>Dala</span>
        </div>
        <div style={styles.navCenter}>
          <a href="#manifesto" style={styles.navLink}>MANIFESTO</a>
          <a href="#features" style={styles.navLink}>FEATURES</a>
          <a href="#tech" style={styles.navLink}>CORE TECH</a>
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
          <span style={styles.eyebrow}>STOP MANAGING KNOWLEDGE. START USING IT.</span>
          <h1 style={styles.heroTitle}>Unlock<br />collective<br />wisdom.</h1>
          <p style={styles.heroDesc}>
            Dala turns your workplace documents into an active conversational partner. 
            No folders, no tags, no endless searching. Just pure, grounded answers.
          </p>
          <button style={styles.primaryButton} onClick={onLaunch}>
            LAUNCH APPLICATION
          </button>
        </div>
        <div style={styles.heroRight}>
          <CanvasConstellation density="comfortable" />
        </div>
      </header>

      {/* Short Product Overview */}
      <section id="manifesto" style={styles.overviewSection}>
        <div style={styles.overviewContainer}>
          <div style={styles.outlineIconWrapper}>
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="var(--color-lichen)" strokeWidth="1">
              <path d="M12 2L2 12l10 10 10-10L12 2zM12 2v20M2 12h20" />
            </svg>
          </div>
          <h2 style={styles.sectionTitle}>A cosmic field of knowledge.</h2>
          <p style={styles.overviewText}>
            Traditional knowledge storage structures documents into static folders that decay over time. 
            Dala extracts semantic details, connects related vectors, and establishes a real-time retrieval network 
            that answers questions directly from your files.
          </p>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.featuresHeader}>
          <span style={styles.eyebrowAccent}>ENGINEERED FOR ACCURACY</span>
          <h2 style={styles.featuresTitle}>Advanced RAG Architecture</h2>
        </div>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Query Expansion</h3>
            <p style={styles.cardDesc}>
              LLM automatically synthesizes multiple variations of your query to perform high-recall multi-vector retrieval, extracting relevant pieces hidden across formats.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Cross-Encoder Reranking</h3>
            <p style={styles.cardDesc}>
              Reranks document candidates in parallel using `gpt-oss-120b` to grade relevance, ensuring the context fed to the generator contains zero noise.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Document Isolation</h3>
            <p style={styles.cardDesc}>
              Every uploaded document is isolated in a sandboxed vector index namespace, ensuring high speed query speeds and strict tenant isolation.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="tech" style={styles.ctaSection}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>Start using collective wisdom.</h2>
          <p style={styles.ctaDesc}>
            Upload a document, type your query, and let the constellation retrieve the answer.
          </p>
          <button style={styles.primaryButton} onClick={onLaunch}>
            LAUNCH APP
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2026 Dala Inc. RAG System. All rights reserved.</p>
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
