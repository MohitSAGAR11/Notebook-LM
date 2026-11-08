import { useCallback, useEffect, useRef, useState } from "react";
import { askQuestion } from "../lib/api";
import { fileSources } from "../lib/sources";

const HISTORY_TURNS = 3; // three Q/A pairs = six messages, what the backend keeps

let turnSeq = 0;
const nextTurnId = () => `t${++turnSeq}`;

function historyFrom(turns) {
  return turns
    .filter((t) => t.status === "answered")
    .slice(-HISTORY_TURNS)
    .flatMap((t) => [
      { role: "user", content: t.question },
      { role: "assistant", content: t.answer },
    ]);
}

/**
 * State for one case file: the transcript, the exhibit register and the
 * in-flight request. All updates are immutable.
 * @param {{ docId: string } | null} doc
 */
export function useCaseFile(doc) {
  const [turns, setTurns] = useState([]);
  const [register, setRegister] = useState([]);
  const registerRef = useRef(register);
  const controllerRef = useRef(null);
  const inFlightRef = useRef(false); // set synchronously, unlike state
  const turnsRef = useRef(turns);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const isAsking = turns.some((t) => t.status === "pending");

  const patchTurn = (id, patch) =>
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const run = useCallback(
    async (id, question, priorTurns) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const { answer, sources } = await askQuestion(
          { docId: doc.docId, question, history: historyFrom(priorTurns) },
          controller.signal,
        );
        // Only one request runs at a time, so the ref is the current register.
        const filed = fileSources(registerRef.current, sources);
        registerRef.current = filed.register;
        setRegister(filed.register);
        patchTurn(id, { status: "answered", answer, cited: filed.cited, isFresh: true });
      } catch (err) {
        if (err.name === "AbortError") {
          patchTurn(id, { status: "cancelled" });
        } else {
          patchTurn(id, { status: "failed", error: err.message });
        }
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
        inFlightRef.current = false;
      }
    },
    [doc],
  );

  const ask = useCallback(
    (question) => {
      const trimmed = question.trim();
      if (!trimmed || !doc || inFlightRef.current) return false;
      inFlightRef.current = true;
      const prior = turnsRef.current;
      const turn = { id: nextTurnId(), question: trimmed, status: "pending", startedAt: Date.now() };
      setTurns((prev) => [...prev, turn]);
      run(turn.id, trimmed, prior);
      return true;
    },
    [doc, run],
  );

  const retry = useCallback(
    (id) => {
      const all = turnsRef.current;
      const index = all.findIndex((t) => t.id === id);
      if (index < 0 || inFlightRef.current) return;
      inFlightRef.current = true;
      patchTurn(id, { status: "pending", error: undefined, startedAt: Date.now() });
      run(id, all[index].question, all.slice(0, index));
    },
    [run],
  );

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  const markSeen = useCallback((id) => patchTurn(id, { isFresh: false }), []);

  return { turns, register, isAsking, ask, retry, cancel, markSeen };
}
