import { useEffect, useRef, useState } from "react";
import { formatBytes, uploadDocument, validateFile } from "../../lib/api";
import { AlertIcon, FileIcon, UploadIcon } from "../ui/Icons";

const SLOW_AFTER_S = 12;

function useElapsed(since) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}

/**
 * Upload form. States: idle → sending (real byte progress) →
 * reading (server-side extraction, chunking, embedding) → filed | failed.
 */
export default function Intake({ onFiled }) {
  const [phase, setPhase] = useState({ name: "idle" });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const elapsed = useElapsed(phase.name === "reading" ? phase.since : null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function file(f) {
    if (!f) return;
    const problem = validateFile(f);
    if (problem) {
      setPhase({ name: "failed", error: problem });
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase({ name: "sending", file: f, progress: 0 });
    try {
      const doc = await uploadDocument(f, {
        signal: controller.signal,
        onProgress: (p) => setPhase((cur) => (cur.name === "sending" ? { ...cur, progress: p } : cur)),
        onSent: () => setPhase({ name: "reading", file: f, since: Date.now() }),
      });
      onFiled({ ...doc, size: f.size, filedAt: new Date() });
    } catch (err) {
      if (err.name === "AbortError") setPhase({ name: "idle" });
      else setPhase({ name: "failed", error: err.message, file: f });
    }
  }

  const busy = phase.name === "sending" || phase.name === "reading";
  const percent = phase.name === "sending" ? Math.round(phase.progress * 100) : 100;

  return (
    <div className="intake">
      <p className="field-label" id="intake-label">
        Document
      </p>

      {!busy && (
        <>
          <div
            className={`dropzone${isDragging ? " is-dragging" : ""}`}
            role="button"
            tabIndex={0}
            aria-labelledby="intake-label intake-hint"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              file(e.dataTransfer.files?.[0]);
            }}
          >
            <span className="dropzone__icon">
              <UploadIcon size={22} />
            </span>
            <span className="dropzone__main" id="intake-hint">
              {isDragging ? "Let go to upload" : "Drop a PDF or .txt here, or click to browse"}
            </span>
            <span className="dropzone__terms">One file, up to 100 MB</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              file(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className="btn btn--orange btn--block" onClick={() => inputRef.current?.click()}>
            Choose a file
          </button>
        </>
      )}

      {busy && (
        <div className="progress" role="status" aria-live="polite">
          <div className="progress__file">
            <FileIcon />
            <span className="progress__name">{phase.file.name}</span>
            <span className="progress__size">{formatBytes(phase.file.size)}</span>
          </div>
          <ol className="progress__steps">
            <li className={phase.name === "sending" ? "is-current" : "is-done"}>
              <span>Uploading</span>
              <span>{phase.name === "sending" ? `${percent}%` : "Done"}</span>
            </li>
            <li className={phase.name === "reading" ? "is-current" : ""}>
              <span>Reading, splitting and indexing</span>
              <span>{phase.name === "reading" ? `${elapsed}s` : "Waiting"}</span>
            </li>
          </ol>
          <div
            className={`meter${phase.name === "reading" ? " meter--busy" : ""}`}
            role="progressbar"
            aria-label={phase.name === "sending" ? "Upload progress" : "Indexing in progress"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase.name === "sending" ? percent : undefined}
          >
            <span style={phase.name === "sending" ? { transform: `scaleX(${phase.progress})` } : undefined} />
          </div>
          {phase.name === "reading" && elapsed >= SLOW_AFTER_S && (
            <p className="progress__note">
              Still working. The server sleeps when nobody is using it and can take up to a minute to
              wake; long PDFs also take longer to index.
            </p>
          )}
          <button type="button" className="btn btn--plate btn--block" onClick={() => controllerRef.current?.abort()}>
            Cancel
          </button>
        </div>
      )}

      {phase.name === "failed" && (
        <div className="alert" role="alert">
          <AlertIcon size={18} />
          <div>
            <p className="alert__title">That file wasn’t uploaded</p>
            <p>{phase.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
