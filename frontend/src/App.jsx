import { useEffect, useState } from "react";
import LandingPage from "./components/landing/LandingPage";
import Workspace from "./components/workspace/Workspace";

const DESK_HASH = "#/desk";

function currentView() {
  return window.location.hash.startsWith(DESK_HASH) ? "desk" : "landing";
}

export default function App() {
  const [view, setView] = useState(currentView);
  // The filed document lives here so an upload from the landing page carries into the notebook.
  const [doc, setDoc] = useState(null);

  // Hash routing keeps Back working and lets Netlify serve one index.html.
  useEffect(() => {
    const onHash = () => {
      const next = currentView();
      setView((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = view === "desk" ? "Notebook · Notebook-LLM" : "Notebook-LLM · Ask your documents";
  }, [view]);

  const go = (hash) => (e) => {
    e?.preventDefault();
    if (window.location.hash !== hash) window.location.hash = hash;
    else setView(currentView());
  };

  const fileAndOpen = (filed) => {
    setDoc(filed);
    window.location.hash = DESK_HASH;
  };

  if (view === "desk") {
    return <Workspace doc={doc} onFiled={setDoc} onNewDoc={() => setDoc(null)} onHome={go("#/")} />;
  }
  return <LandingPage onLaunch={go(DESK_HASH)} onFiled={fileAndOpen} />;
}
