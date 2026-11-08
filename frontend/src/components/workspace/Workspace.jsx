import { useCallback, useEffect, useRef, useState } from "react";
import { useCaseFile } from "../../hooks/useCaseFile";
import PillNav from "../ui/PillNav";
import Reveal from "../ui/Reveal";
import { GithubIcon, HomeIcon, LayersIcon, NotebookIcon, QuoteIcon } from "../ui/Icons";
import { REPO_URL } from "../landing/content";
import Intake from "./Intake";
import DocCard from "./DocCard";
import Transcript from "./Transcript";
import Composer from "./Composer";
import SourceViewer from "./SourceViewer";
import "./workspace.css";

function navItems(onHome) {
  return [
    { label: "Front page", href: "#/", icon: HomeIcon, onClick: onHome },
    { label: "Notebook", href: "#/desk", icon: NotebookIcon, current: true },
    { label: "How it works", href: "#/", icon: LayersIcon, onClick: onHome },
    { label: "Source on GitHub", href: REPO_URL, icon: GithubIcon, external: true },
  ];
}

function Desk({ doc, onNewDoc, onHome }) {
  const { turns, register, isAsking, ask, retry, cancel, markSeen } = useCaseFile(doc);
  const [draft, setDraft] = useState("");
  const [activeSource, setActiveSource] = useState(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null);

  const openSource = useCallback((number, opener) => {
    openerRef.current = opener ?? null;
    setActiveSource(number);
  }, []);

  const closeSource = useCallback(() => {
    setActiveSource(null);
    const opener = openerRef.current;
    // Return focus to whatever opened the source, if it is still on the page.
    requestAnimationFrame(() => (opener?.isConnected ? opener : inputRef.current)?.focus());
  }, []);

  useEffect(() => {
    if (activeSource === null) return undefined;
    const onKey = (e) => e.key === "Escape" && closeSource();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSource, closeSource]);

  const submit = () => {
    if (ask(draft)) setDraft("");
  };

  const pick = (q) => {
    setDraft(q);
    inputRef.current?.focus();
  };

  const source = register.find((s) => s.number === activeSource);
  const citedIn = source ? turns.filter((t) => t.cited?.includes(source.number)).length : 0;

  return (
    <div className="desk">
      <a className="skip-link" href="#question">
        Skip to the question box
      </a>
      <PillNav items={navItems(onHome)} label="Notebook" />

      <div className="frame">
        <div className="frame__left">
          <DocCard
            doc={doc}
            register={register}
            activeSource={activeSource}
            onOpenSource={openSource}
            onNewDoc={onNewDoc}
            onHome={onHome}
            hasTurns={turns.length > 0}
          />
        </div>

        <main id="main" className="frame__right desk__main">
          <Transcript
            doc={doc}
            turns={turns}
            onPick={pick}
            register={register}
            activeSource={activeSource}
            onOpenSource={openSource}
            onRevealed={markSeen}
            onRetry={retry}
            onCancel={cancel}
          />
          <div className="desk__compose">
            <Composer value={draft} onChange={setDraft} onSubmit={submit} isBusy={isAsking} inputRef={inputRef} />
          </div>
        </main>
      </div>

      {source && (
        <>
          <button type="button" className="scrim" tabIndex={-1} aria-hidden="true" onClick={closeSource} />
          <SourceViewer
            source={source}
            doc={doc}
            citedIn={citedIn}
            total={register.length}
            onClose={closeSource}
            onStep={(d) => setActiveSource((n) => Math.min(register.length, Math.max(1, n + d)))}
          />
        </>
      )}
    </div>
  );
}

function EmptyDesk({ onFiled, onHome }) {
  return (
    <div className="desk">
      <PillNav items={navItems(onHome)} label="Notebook" />
      <div className="frame">
        <div className="frame__left">
          <aside className="id-card doc-card doc-card--empty" aria-label="No document yet">
            <div className="doc-card__tile doc-card__tile--empty">
              <QuoteIcon size={30} />
              <span className="doc-card__count">Nothing uploaded yet</span>
            </div>
            <h2 className="id-card__name">Notebook-LLM</h2>
            <p className="id-card__desc">One document per notebook. Its passages become the only source of every answer.</p>
          </aside>
        </div>
        <main id="main" className="frame__right desk__intake">
          <Reveal as="h1" className="display display--l">
            <span>Drop a</span>
            <span className="dim">document</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={60}>
            PDF or plain text, up to 100 MB. It gets read, split into passages and indexed, then you can
            ask it anything.
          </Reveal>
          <Reveal delay={120}>
            <Intake onFiled={onFiled} />
          </Reveal>
        </main>
      </div>
    </div>
  );
}

export default function Workspace({ doc, onFiled, onNewDoc, onHome }) {
  if (!doc) return <EmptyDesk onFiled={onFiled} onHome={onHome} />;
  return <Desk key={doc.docId} doc={doc} onNewDoc={onNewDoc} onHome={onHome} />;
}
