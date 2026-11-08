import { useState } from "react";
import { formatBytes } from "../../lib/api";
import { formatMatch, passageLabel } from "../../lib/sources";
import { FileIcon, GithubIcon, HomeIcon, QuoteIcon, UploadIcon } from "../ui/Icons";
import { REPO_URL } from "../landing/content";

function preview(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
}

function SourceList({ register, activeSource, onOpenSource }) {
  if (register.length === 0) {
    return <p className="sources__empty">Passages an answer uses are listed here, numbered.</p>;
  }
  return (
    <ul className="sources__list">
      {register.map((s) => (
        <li key={s.key}>
          <button
            type="button"
            className={`sources__item${activeSource === s.number ? " is-active" : ""}`}
            onClick={(e) => onOpenSource(s.number, e.currentTarget)}
            aria-current={activeSource === s.number ? "true" : undefined}
          >
            <span className="chip__n">{s.number}</span>
            <span className="sources__text">
              <span className="sources__head">
                {passageLabel(s.chunkIndex)}
                <span>{formatMatch(s.score)}</span>
              </span>
              <span className="sources__preview">{preview(s.text)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The white card: the filed document, its sources, and the ways out. */
export default function DocCard({ doc, register, activeSource, onOpenSource, onNewDoc, onHome, hasTurns }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const requestNew = () => (hasTurns ? setIsConfirming(true) : onNewDoc());

  return (
    <aside className="id-card doc-card" aria-label="Document and sources">
      <div className="doc-card__tile">
        <FileIcon size={30} />
        <span className="doc-card__count">
          {doc.chunkCount} passages{doc.size ? ` · ${formatBytes(doc.size)}` : ""}
        </span>
      </div>
      <h2 className="id-card__name doc-card__name" title={doc.fileName}>
        {doc.fileName}
      </h2>

      <section className={`sources${isListOpen ? " is-open" : ""}`} aria-labelledby="sources-title">
        <h3 id="sources-title" className="sources__title">
          <span className="sources__badge" aria-hidden="true">
            <QuoteIcon size={14} />
          </span>
          Sources <span className="sources__count">{register.length}</span>
          <button
            type="button"
            className="sources__toggle"
            onClick={() => setIsListOpen((v) => !v)}
            aria-expanded={isListOpen}
          >
            {isListOpen ? "Hide" : "Show"}
          </button>
        </h3>
        <SourceList register={register} activeSource={activeSource} onOpenSource={onOpenSource} />
      </section>

      {isConfirming ? (
        <div className="confirm" role="group" aria-label="Start over with a new document?">
          <p>Start over? This conversation will be cleared.</p>
          <div className="confirm__actions">
            <button type="button" className="btn btn--orange btn--small" onClick={onNewDoc}>
              New document
            </button>
            <button type="button" className="btn btn--small confirm__keep" onClick={() => setIsConfirming(false)}>
              Keep this one
            </button>
          </div>
        </div>
      ) : (
        <div className="id-card__icons">
          <button type="button" onClick={requestNew} aria-label="Upload a new document" title="New document">
            <UploadIcon size={22} />
          </button>
          <a href="#/" onClick={onHome} aria-label="Back to the front page" title="Front page">
            <HomeIcon size={22} />
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Source code on GitHub" title="Source on GitHub">
            <GithubIcon size={22} />
          </a>
        </div>
      )}
    </aside>
  );
}
