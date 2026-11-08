import { GithubIcon, LayersIcon, NotebookIcon, PlayIcon, QuoteIcon } from "../ui/Icons";
import { DEMO_URL, REPO_URL } from "./content";

/** Dashed orange arcs that run off the card's edges. Pure geometry. */
function Arcs() {
  return (
    <>
      <svg className="id-card__arc id-card__arc--top" width="194" height="100" viewBox="0 0 194 100" aria-hidden="true">
        <path d="M2 2c22 58 92 96 150 92 22-2 34-42 40-92" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="9 7" strokeLinecap="round" />
      </svg>
    </>
  );
}

/** The product's own picture: a page, a highlighted passage, and the source it became. */
function DocArt() {
  return (
    <div className="doc-art" aria-hidden="true">
      <div className="doc-art__page">
        <span className="doc-art__line" style={{ width: "62%" }} />
        <span className="doc-art__line" />
        <span className="doc-art__line" style={{ width: "88%" }} />
        <span className="doc-art__line doc-art__line--hit" />
        <span className="doc-art__line doc-art__line--hit" style={{ width: "70%" }} />
        <span className="doc-art__line" style={{ width: "92%" }} />
        <span className="doc-art__line" style={{ width: "54%" }} />
      </div>
      <div className="doc-art__ask">When was it built?</div>
      <div className="doc-art__source">
        <span className="chip__n">1</span>
        <span>
          Passage 4<em>92% match</em>
        </span>
      </div>
    </div>
  );
}

export default function IdCard({ onLaunch }) {
  return (
    <aside className="id-card id-card--hero" aria-label="About Notebook-LLM">
      <Arcs />
      <DocArt />
      <h2 className="id-card__name">Notebook-LLM</h2>
      <span className="id-card__badge" aria-hidden="true">
        {/* Anchored to the badge so the arc always leaves from it, whatever the card height. */}
        <svg className="id-card__arc id-card__arc--side" width="270" height="64" viewBox="0 0 270 64" aria-hidden="true">
          <path d="M268 2c-10 30-40 48-96 54-50 6-110 6-170 6" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="9 7" strokeLinecap="round" />
        </svg>
        <QuoteIcon size={18} />
      </span>
      <p className="id-card__desc">Ask a document anything. Every answer shows where it came from.</p>
      <div className="id-card__icons">
        <a href="#/desk" onClick={onLaunch} aria-label="Open the notebook" title="Open the notebook">
          <NotebookIcon size={22} />
        </a>
        <a href="#pipeline" aria-label="How it works" title="How it works">
          <LayersIcon size={22} />
        </a>
        <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" aria-label="Watch the 20-second demo" title="Watch the demo">
          <PlayIcon size={22} />
        </a>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Source code on GitHub" title="Source on GitHub">
          <GithubIcon size={22} />
        </a>
      </div>
    </aside>
  );
}
