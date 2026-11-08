import { useEffect, useState } from "react";

const MS_PER_CHAR = 6;
const MIN_MS = 500;
const MAX_MS = 2200;

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Reveal a finished answer progressively so it reads as it arrives.
 * The backend returns whole answers; this only paces the display, and it is
 * skipped entirely for reduced motion or when `active` is false.
 * @param {string} text
 * @param {boolean} active
 * @returns {{ shown: string, done: boolean, finish: () => void }}
 */
export function useReveal(text, active) {
  const instant = !active || prefersReducedMotion();
  const [count, setCount] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) return undefined;
    const duration = Math.min(MAX_MS, Math.max(MIN_MS, text.length * MS_PER_CHAR));
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setCount(Math.round(eased * text.length));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [text, instant]);

  const shownCount = instant ? text.length : count;
  // Cut at a word boundary so partial markdown never flickers mid-token.
  const cut = shownCount >= text.length ? text.length : text.lastIndexOf(" ", shownCount);
  return {
    shown: text.slice(0, Math.max(0, cut)),
    done: shownCount >= text.length,
    finish: () => setCount(text.length),
  };
}
