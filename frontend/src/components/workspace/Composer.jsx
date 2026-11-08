import { useEffect, useLayoutEffect } from "react";
import { SendIcon } from "../ui/Icons";

const MAX_HEIGHT = 180;

/** Question box. Enter sends, Shift+Enter adds a line, "/" focuses from anywhere. */
export default function Composer({ value, onChange, onSubmit, isBusy, inputRef }) {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, inputRef]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputRef]);

  const canSend = value.trim().length > 0 && !isBusy;

  const submit = (e) => {
    e.preventDefault();
    if (canSend) onSubmit();
  };

  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="question" className="field-label">
        Your question
      </label>
      <div className="composer__box">
        <textarea
          id="question"
          ref={inputRef}
          rows={1}
          value={value}
          placeholder={isBusy ? "Waiting for the answer…" : "Ask about this document"}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
          }}
          maxLength={2000}
        />
        <button type="submit" className="composer__send" disabled={!canSend} aria-label="Ask">
          <SendIcon size={18} />
        </button>
      </div>
      <p className="composer__hint">
        <kbd>Enter</kbd> to ask · <kbd>Shift</kbd> + <kbd>Enter</kbd> new line · <kbd>/</kbd> to jump here
      </p>
    </form>
  );
}
