import { useEffect, useMemo, useState } from "react";
import { useReveal } from "../../hooks/useReveal";
import { renderMarkdown } from "../../lib/markdown";
import { passageLabel } from "../../lib/sources";
import SourceChip from "../ui/SourceChip";
import { AlertIcon, RetryIcon, StopIcon } from "../ui/Icons";

function Pending({ startedAt, onCancel }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return (
    <div className="pending" role="status" aria-live="polite">
      <p className="pending__line">
        <span className="pending__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Searching the document and checking passages
        <span className="pending__time">{seconds}s</span>
      </p>
      {seconds >= 15 && (
        <p className="pending__note">
          Each answer takes a vector search and several model calls on a free tier, so this can run
          to a minute.
        </p>
      )}
      <button type="button" className="btn btn--plate btn--small" onClick={onCancel}>
        <StopIcon size={14} /> Stop
      </button>
    </div>
  );
}

function Answer({ turn, register, activeSource, onOpenSource, onRevealed }) {
  const { shown, done } = useReveal(turn.answer, turn.isFresh);
  const html = useMemo(() => renderMarkdown(shown), [shown]);

  useEffect(() => {
    if (done && turn.isFresh) onRevealed(turn.id);
  }, [done, turn.isFresh, turn.id, onRevealed]);

  return (
    <>
      {/* Model output is sanitized with DOMPurify in renderMarkdown. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      {done && turn.cited.length > 0 && (
        <div className="turn__sources">
          <span className="turn__sources-label">Sources</span>
          {turn.cited.map((n) => {
            const src = register.find((s) => s.number === n);
            return (
              <SourceChip
                key={n}
                number={n}
                label={src ? passageLabel(src.chunkIndex) : undefined}
                isActive={activeSource === n}
                onOpen={(e) => onOpenSource(n, e.currentTarget)}
              />
            );
          })}
        </div>
      )}
      {done && turn.cited.length === 0 && (
        <p className="turn__none">No passages were used for this answer.</p>
      )}
    </>
  );
}

export default function Turn({ turn, onRetry, onCancel, ...answerProps }) {
  return (
    <li className="turn">
      <h2 className="turn__q">{turn.question}</h2>
      <div className="turn__a">
        {turn.status === "pending" && <Pending startedAt={turn.startedAt} onCancel={onCancel} />}
        {turn.status === "answered" && <Answer turn={turn} {...answerProps} />}
        {turn.status === "cancelled" && (
          <div className="turn__note">
            <p>Stopped before an answer came back.</p>
            <button type="button" className="btn btn--plate btn--small" onClick={() => onRetry(turn.id)}>
              <RetryIcon size={14} /> Ask again
            </button>
          </div>
        )}
        {turn.status === "failed" && (
          <div className="alert" role="alert">
            <AlertIcon size={18} />
            <div>
              <p className="alert__title">No answer this time</p>
              <p>{turn.error}</p>
              <button type="button" className="btn btn--plate btn--small" onClick={() => onRetry(turn.id)}>
                <RetryIcon size={14} /> Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
