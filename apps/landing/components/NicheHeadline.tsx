"use client";

import { useEffect, useState } from "react";

const NICHES: { word: string; article: "seu" | "sua" }[] = [
  { word: "Barbearia", article: "sua" },
  { word: "Salão de Beleza", article: "seu" },
  { word: "Studio de Lash", article: "seu" },
  { word: "Nail Studio", article: "seu" },
  { word: "Clínica de Estética", article: "sua" },
];

const TYPE_MS = 65;
const DELETE_MS = 40;
const HOLD_MS = 2400;
const PAUSE_MS = 400;

type Phase = "hold" | "deleting" | "pause" | "typing";

export function NicheHeadline() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(NICHES[0].word);
  const [phase, setPhase] = useState<Phase>("hold");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "hold") {
      timeout = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timeout = setTimeout(() => setText((t) => t.slice(0, -1)), DELETE_MS);
      } else {
        timeout = setTimeout(() => setPhase("pause"), PAUSE_MS);
      }
    } else if (phase === "pause") {
      setIndex((i) => (i + 1) % NICHES.length);
      setPhase("typing");
    } else {
      const target = NICHES[index].word;
      if (text.length < target.length) {
        timeout = setTimeout(() => setText(target.slice(0, text.length + 1)), TYPE_MS);
      } else {
        timeout = setTimeout(() => setPhase("hold"), 0);
      }
    }

    return () => clearTimeout(timeout);
  }, [phase, text, index, reducedMotion]);

  const current = NICHES[index];

  if (reducedMotion) {
    return (
      <>
        {current.article}
        <br />
        <span className="font-bold text-white">{current.word}</span>.
      </>
    );
  }

  return (
    <>
      {current.article}
      <br />
      <span className="font-bold text-white">
        {text}
        <span
          className="ml-0.5 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] animate-caret-blink bg-white align-middle"
          aria-hidden
        />
      </span>
      .
    </>
  );
}
