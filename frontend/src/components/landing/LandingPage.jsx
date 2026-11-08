import PillNav from "../ui/PillNav";
import Reveal from "../ui/Reveal";
import { ArrowRight, ArrowUpRight, BoxesIcon, HelpIcon, HomeIcon, LayersIcon, NotebookIcon, QuoteIcon, UploadIcon } from "../ui/Icons";
import Intake from "../workspace/Intake";
import IdCard from "./IdCard";
import { FAQ, PIPELINE, REPO_URL, SHOWCASE, STATS } from "./content";
import { STACK } from "./stackLogos";
import "./landing.css";

function Heading({ top, dim, size = "l", id, as: Tag = "h2" }) {
  return (
    <Reveal as={Tag} id={id} className={`display display--${size}`}>
      <span>{top}</span>
      <span className="dim">{dim}</span>
    </Reveal>
  );
}

function Tiles({ onLaunch }) {
  return (
    <div className="tiles">
      <Reveal as="a" href="#/desk" onClick={onLaunch} className="tile tile--orange" delay={80}>
        <svg className="tile__lines" viewBox="0 0 300 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-20 170c60-40 120 30 170-10s40-120 90-130 70 40 90 20" />
          <path d="M-20 215c80-30 140 20 210-20s70-70 130-60" />
        </svg>
        <UploadIcon size={30} />
        <span className="tile__label">Upload a file, ask in plain words</span>
        <span className="tile__go" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </Reveal>
      <Reveal as="a" href="#pipeline" className="tile tile--lime" delay={160}>
        <svg className="tile__lines" viewBox="0 0 366 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 40 40 120 90 10l40 150 60-140 40 160 60-150 50 120 40-100" />
        </svg>
        <QuoteIcon size={30} />
        <span className="tile__label">Every answer cites its passages</span>
        <span className="tile__go" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </Reveal>
    </div>
  );
}

export default function LandingPage({ onLaunch, onFiled }) {
  const nav = [
    { label: "Home", href: "#top", icon: HomeIcon, current: true },
    { label: "How it works", href: "#pipeline", icon: LayersIcon },
    { label: "Stack", href: "#stack", icon: BoxesIcon },
    { label: "Questions", href: "#faq", icon: HelpIcon },
    { label: "Open the notebook", href: "#/desk", icon: NotebookIcon, onClick: onLaunch, accent: true },
  ];

  return (
    <div className="landing" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <PillNav items={nav} />

      <div className="frame">
        <div className="frame__left">
          <Reveal>
            <IdCard onLaunch={onLaunch} />
          </Reveal>
        </div>

        <main id="main" className="frame__right">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__info">
              <Heading as="h1" id="hero-title" size="xl" top="Ask your" dim="documents" />
              <Reveal as="p" className="lede" delay={60}>
                Upload a PDF or text file and question it. Answers come only from what the file
                says, and each one shows the passages it used.
              </Reveal>
            </div>

            <Reveal as="dl" className="stats" delay={100}>
              {STATS.map((s) => (
                <div key={s.value} className="stat">
                  <dt className="stat__value">{s.value}</dt>
                  <dd className="stat__label">
                    {s.label[0]}
                    <br />
                    {s.label[1]}
                  </dd>
                </div>
              ))}
            </Reveal>

            <Tiles onLaunch={onLaunch} />
          </section>

          <section className="block" aria-labelledby="showcase-title">
            <Heading id="showcase-title" top="See it" dim="work" />
            <ul className="list">
              {SHOWCASE.map((item, i) => (
                <Reveal as="li" key={item.title} delay={i * 70}>
                  <a className="row row--thumb" href="#/desk" onClick={onLaunch}>
                    <span className={`thumb thumb--${item.tone}`}>
                      <img src={item.img} alt={item.alt} width="118" height="123" loading="lazy" />
                    </span>
                    <span className="row__details">
                      <span className="row__title">{item.title}</span>
                      <span className="row__body">{item.body}</span>
                    </span>
                    <span className="row__arrow" aria-hidden="true">
                      <ArrowUpRight size={18} />
                    </span>
                  </a>
                </Reveal>
              ))}
            </ul>
          </section>

          <section className="block" id="pipeline" aria-labelledby="pipeline-title">
            <Heading id="pipeline-title" top="Six steps" dim="per answer" />
            <ol className="list">
              {PIPELINE.map((step, i) => (
                <Reveal as="li" key={step.title} delay={(i % 3) * 70}>
                  <a className="row" href={step.href} target="_blank" rel="noopener noreferrer">
                    <span className="row__title">
                      <span className="row__step">{String(i + 1).padStart(2, "0")}</span>
                      {step.title}
                    </span>
                    <span className="row__body">{step.body}</span>
                    <span className="row__meta">
                      <span>{step.meta[0]}</span>
                      <span>{step.meta[1]}</span>
                    </span>
                    <span className="row__arrow" aria-hidden="true">
                      <ArrowUpRight size={18} />
                    </span>
                    <span className="visually-hidden">(opens the source file on GitHub)</span>
                  </a>
                </Reveal>
              ))}
            </ol>
          </section>

          <section className="block" id="stack" aria-labelledby="stack-title">
            <Heading id="stack-title" top="Built" dim="with" />
            <ul className="stack">
              {STACK.map((tool, i) => (
                <Reveal as="li" key={tool.name} className="tool" delay={(i % 2) * 70}>
                  <span className="tool__logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill={tool.hex}>
                      <path d={tool.path} />
                    </svg>
                  </span>
                  <span>
                    <span className="tool__name">{tool.name}</span>
                    <span className="tool__role">{tool.role}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
            <Reveal as="p" className="stack__note">
              Vectors live in Pinecone; query expansion, re-ranking and answers run on OpenRouter.
            </Reveal>
          </section>

          <section className="block" id="faq" aria-labelledby="faq-title">
            <Heading id="faq-title" top="Fair" dim="questions" />
            <ul className="list">
              {FAQ.map((item, i) => (
                <Reveal as="li" key={item.q} delay={i * 70}>
                  <article className="row row--hover">
                    <h3 className="row__title">{item.q}</h3>
                    <p className="row__body">{item.a}</p>
                    <p className="row__meta">
                      <span>{item.meta[0]}</span>
                      <span>{item.meta[1]}</span>
                    </p>
                  </article>
                </Reveal>
              ))}
            </ul>
          </section>

          <section className="block" id="start" aria-labelledby="start-title">
            <Heading id="start-title" top="Start" dim="reading" />
            <Reveal className="start">
              <Intake onFiled={onFiled} />
            </Reveal>
          </section>

          <footer className="site-footer">
            Built by <span className="accent">Mohit Sagar</span> |{" "}
            <a className="accent" href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Source on GitHub
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
