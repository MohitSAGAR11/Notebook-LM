import { useEffect, useRef } from "react";
import Reveal from "../ui/Reveal";
import { ArrowUpRight } from "../ui/Icons";
import Turn from "./Turn";

const STARTERS = [
  { q: "Summarize this document in five points.", hint: "A fast overview" },
  { q: "What are the key terms, and how does it define them?", hint: "Vocabulary and definitions" },
  { q: "What questions does this document leave unanswered?", hint: "Find the gaps" },
];

function Empty({ doc, onPick }) {
  return (
    <div className="empty">
      <Reveal as="h1" className="display display--l">
        <span>Ask the</span>
        <span className="dim">document</span>
      </Reveal>
      <Reveal as="p" className="lede" delay={60}>
        {doc.chunkCount} passages from <strong className="empty__file">{doc.fileName}</strong> are indexed.
        Ask anything it should be able to answer.
      </Reveal>
      <ul className="list empty__starters">
        {STARTERS.map((s, i) => (
          <Reveal as="li" key={s.q} delay={100 + i * 70}>
            <button type="button" className="row" onClick={() => onPick(s.q)}>
              <span className="row__title">{s.q}</span>
              <span className="row__body">{s.hint}</span>
              <span className="row__arrow" aria-hidden="true">
                <ArrowUpRight size={18} />
              </span>
            </button>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

export default function Transcript({ doc, turns, onPick, ...turnProps }) {
  const endRef = useRef(null);
  const last = turns[turns.length - 1];
  const lastKey = last ? `${last.id}:${last.status}` : "";

  useEffect(() => {
    if (lastKey) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastKey]);

  if (turns.length === 0) return <Empty doc={doc} onPick={onPick} />;

  return (
    <>
      <h1 className="visually-hidden">Questions about {doc.fileName}</h1>
      <ol className="transcript">
        {turns.map((turn) => (
          <Turn key={turn.id} turn={turn} {...turnProps} />
        ))}
      </ol>
      <div ref={endRef} className="transcript__end" />
    </>
  );
}
