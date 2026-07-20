"use client";

import { useEffect, useState } from "react";

const PROGRESS_STAGES = [
  "Understanding your shopping goal",
  "Searching the product catalog",
  "Checking inventory and substitutes",
  "Balancing the shared budget",
  "Preparing the cart and decision log",
];

export function Loading() {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 350);
    return () => window.clearInterval(intervalId);
  }, []);

  const stageIndex = Math.min(PROGRESS_STAGES.length - 1, Math.floor(elapsedMs / 4_000));
  const progress = Math.min(92, 12 + Math.round(elapsedMs / 400));

  return (
    <section className="loading-panel" aria-live="polite" aria-label="Agent is composing the cart">
      <div className="eyebrow">Agent working</div>
      <h2>Building your cart.</h2>
      <p>{PROGRESS_STAGES[stageIndex]}</p>
      <div className="progress-meta"><span>{progress}% complete</span><span>Working through constraints</span></div>
      <div className="progress-track" role="progressbar" aria-label="Cart composition progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <ol className="progress-stages" aria-label="Cart composition steps">
        {PROGRESS_STAGES.map((stage, index) => <li className={index <= stageIndex ? "is-active" : ""} key={stage}>{stage}</li>)}
      </ol>
    </section>
  );
}
