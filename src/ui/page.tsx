"use client";

import { useState } from "react";
import type { CartOutput } from "../shared/types.js";
import { CartDisplay } from "./components/cart-display";
import { DecisionLog } from "./components/decision-log";
import { ErrorDisplay } from "./components/error-display";
import { GapReport } from "./components/gap-report";
import { GoalInput } from "./components/goal-input";
import { Loading } from "./components/loading";

const INITIAL_GOAL = "business casual outfit for a job interview, budget $150";

export default function ForagePage() {
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [allInStock, setAllInStock] = useState(true);
  const [result, setResult] = useState<CartOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  async function composeCart(): Promise<void> {
    setError(null);
    setErrorRequestId(undefined);
    setResult(null);
    setIsLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 125_000);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, allInStock }),
        signal: controller.signal,
      });
      const responseText = await response.text();
      let payload: CartOutput | { error?: string; requestId?: string };
      try {
        payload = JSON.parse(responseText) as CartOutput | { error?: string; requestId?: string };
      } catch {
        throw new Error("The cart service returned an unreadable response. Please try again.");
      }
      if (!response.ok || !("items" in payload)) {
        if ("requestId" in payload) setErrorRequestId(payload.requestId);
        throw new Error("error" in payload && payload.error ? payload.error : "The cart agent returned an invalid response.");
      }
      setResult(payload);
    } catch (caught) {
      const message = caught instanceof DOMException && caught.name === "AbortError"
        ? "The request took too long. Please try again."
        : caught instanceof Error ? caught.message : "The cart agent could not complete this request.";
      setError(message);
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  function selectScenario(nextGoal: string, nextAllInStock: boolean): void {
    setGoal(nextGoal);
    setAllInStock(nextAllInStock);
    setResult(null);
    setError(null);
    setErrorRequestId(undefined);
  }

  return (
    <main className="forage-shell">
      <header className="site-header"><a className="brand" href="#top">Forage<span>.</span></a><p>Agentic cart composition engine</p></header>
      <div className="hero-rule" />
      <div className="workspace" id="top">
        <GoalInput goal={goal} allInStock={allInStock} isLoading={isLoading} onGoalChange={setGoal} onAllInStockChange={setAllInStock} onSubmit={() => void composeCart()} onScenario={selectScenario} />
        <section className="results-column" aria-live="polite">
          {isLoading && <Loading />}
          {error && <ErrorDisplay message={error} requestId={errorRequestId} onRetry={() => void composeCart()} />}
          {!isLoading && !error && !result && <section className="empty-panel"><div className="eyebrow">Ready to compose</div><h2>Start with a goal.</h2><p>Forage will show the selected items, budget math, tool trace, and any catalog gaps.</p></section>}
          {result && !isLoading && <><CartDisplay cart={result} /><GapReport gaps={result.gap_report} /><DecisionLog entries={result.decision_log} /></>}
        </section>
      </div>
    </main>
  );
}
