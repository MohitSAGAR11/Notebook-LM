import { useEffect, useRef } from "react";
import { formatMatch, passageLabel } from "../../lib/sources";
import { ArrowRight, CloseIcon } from "../ui/Icons";

/** A sheet showing one source passage in full, with where it sits in the file. */
export default function SourceViewer({ source, doc, citedIn, total, onClose, onStep }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [source.number]);

  const position = Number.isFinite(source.chunkIndex)
    ? `${passageLabel(source.chunkIndex)} of ${doc.chunkCount}`
    : "Passage";

  return (
    <div className="viewer" role="dialog" aria-modal="false" aria-labelledby="viewer-title">
      <div className="viewer__bar">
        <h2 id="viewer-title" className="viewer__title" tabIndex={-1} ref={headingRef}>
          <span className="chip__n">{source.number}</span>
          Source {source.number}
        </h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close source (Esc)">
          <CloseIcon />
        </button>
      </div>

      <dl className="viewer__facts">
        <div>
          <dt>Position</dt>
          <dd>{position}</dd>
        </div>
        <div>
          <dt>Match</dt>
          <dd>{formatMatch(source.score)}</dd>
        </div>
        <div>
          <dt>Used in</dt>
          <dd>
            {citedIn} answer{citedIn === 1 ? "" : "s"}
          </dd>
        </div>
      </dl>

      <div className="viewer__body">
        <article className="viewer__sheet">
          <p className="viewer__file">{source.source || doc.fileName}</p>
          <p className="viewer__text">{source.text}</p>
        </article>
        {source.isExcerpt && (
          <p className="viewer__note">The server sent only the first 200 characters of this passage.</p>
        )}
      </div>

      <div className="viewer__nav">
        <button type="button" className="btn btn--plate btn--small" onClick={() => onStep(-1)} disabled={source.number <= 1}>
          <span className="flip" aria-hidden="true">
            <ArrowRight size={14} />
          </span>
          Previous
        </button>
        <span className="viewer__pos">
          {source.number} / {total}
        </span>
        <button type="button" className="btn btn--plate btn--small" onClick={() => onStep(1)} disabled={source.number >= total}>
          Next <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
