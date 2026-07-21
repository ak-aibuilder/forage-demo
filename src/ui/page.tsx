"use client";

import { useEffect, useState } from "react";
import type { RawSearchResult } from "../shared/raw-search.js";
import type { CartOutput, EnrichedIndex, EnrichedProduct } from "../shared/types.js";
import { CatalogBrowser } from "./components/catalog-browser";
import { CartDisplay } from "./components/cart-display";
import { ConstraintChips } from "./components/constraint-chips";
import { DecisionLog } from "./components/decision-log";
import { ErrorDisplay } from "./components/error-display";
import { ExportButton } from "./components/export-button";
import { GapReport } from "./components/gap-report";
import { GoalInput } from "./components/goal-input";
import { Loading } from "./components/loading";
import { OffTopicNudge } from "./components/off-topic-nudge";
import { QueryStats } from "./components/query-stats";
import { RawResults } from "./components/raw-results";

const INITIAL_GOAL = "business casual outfit for a job interview, budget $150";

interface OffTopicResponse {
  error: "off_topic";
  message: string;
  suggestions: string[];
  requestId?: string;
}

export default function ForagePage() {
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [allInStock, setAllInStock] = useState(true);
  const [result, setResult] = useState<CartOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offTopic, setOffTopic] = useState<OffTopicResponse | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [catalog, setCatalog] = useState<EnrichedProduct[]>([]);
  const [catalogError, setCatalogError] = useState<string | undefined>();
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [rawResults, setRawResults] = useState<RawSearchResult[]>([]);
  const [rawError, setRawError] = useState<string | undefined>();
  const [isRawLoading, setIsRawLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog(): Promise<void> {
      try {
        const response = await fetch("/api/catalog", { signal: controller.signal });
        const payload = await response.json() as EnrichedIndex | { error?: string };
        if (!response.ok || !("products" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "The product catalog is unavailable.");
        setCatalog(payload.products);
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) setCatalogError(caught instanceof Error ? caught.message : "The product catalog is unavailable.");
      } finally {
        setIsCatalogLoading(false);
      }
    }
    void loadCatalog();
    return () => controller.abort();
  }, []);

  async function composeCart(): Promise<void> {
    setError(null);
    setOffTopic(null);
    setErrorRequestId(undefined);
    setResult(null);
    setIsLoading(true);
    setHasRun(true);
    setRawResults([]);
    setRawError(undefined);

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
      let payload: CartOutput | OffTopicResponse | { error?: string; requestId?: string };
      try {
        payload = JSON.parse(responseText) as CartOutput | { error?: string; requestId?: string };
      } catch {
        throw new Error("The cart service returned an unreadable response. Please try again.");
      }
      if ("error" in payload && payload.error === "off_topic" && "message" in payload && typeof payload.message === "string" && "suggestions" in payload && Array.isArray(payload.suggestions)) {
        setOffTopic({ error: "off_topic", message: payload.message, suggestions: payload.suggestions, requestId: payload.requestId });
        setHasRun(false);
        return;
      }
      if (!response.ok || !("items" in payload)) {
        if ("requestId" in payload) setErrorRequestId(payload.requestId);
        throw new Error("error" in payload && payload.error ? payload.error : "The cart agent returned an invalid response.");
      }
      setResult(payload);
      setIsRawLoading(true);
      void fetch("/api/raw-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      }).then(async (rawResponse) => {
        const rawPayload = await rawResponse.json() as { results?: RawSearchResult[]; error?: string };
        if (!rawResponse.ok || !Array.isArray(rawPayload.results)) throw new Error(rawPayload.error ?? "Raw catalog search failed.");
        setRawResults(rawPayload.results);
      }).catch((caught) => {
        setRawError(caught instanceof Error ? caught.message : "Raw catalog search failed.");
      }).finally(() => setIsRawLoading(false));
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
    setOffTopic(null);
    setErrorRequestId(undefined);
    setRawResults([]);
    setRawError(undefined);
    setIsRawLoading(false);
    setHasRun(false);
  }

  function handleGoalChange(nextGoal: string): void {
    setGoal(nextGoal);
    setAllInStock(true);
    setOffTopic(null);
  }

  return (
    <main className="forage-shell">
      <header className="site-header"><a className="brand" href="#top">Forage<span>.</span></a><p>Agentic cart composition engine</p></header>
      <div className="hero-rule" />
      <div className="input-stack" id="top">
        <CatalogBrowser products={catalog} isLoading={isCatalogLoading} error={catalogError} />
        <GoalInput goal={goal} isLoading={isLoading} onGoalChange={handleGoalChange} onSubmit={() => void composeCart()} onScenario={selectScenario} />
      </div>
      <section className="comparison-section" aria-labelledby="comparison-heading">
        <header className="comparison-header"><div className="eyebrow">Side-by-side result</div><h2 id="comparison-heading">Same goal, same products, different data</h2><p>Compare a literal raw-catalog match with a constraint-aware composed cart.</p></header>
        <div className="result-comparison">
          <div className="raw-comparison-panel">
            <RawResults results={rawResults} isLoading={isRawLoading} error={rawError} hasRun={hasRun} />
          </div>
          <section className="enriched-comparison-panel" aria-live="polite" aria-labelledby="enriched-results-heading">
            <div className="comparison-side-label">With Enrichment</div>
            <h3 id="enriched-results-heading">Agentic composition (GPT-5.6 Sol)</h3>
            <p className="comparison-benefit">Constraint-aware selection, inventory replanning, and full-cart budget control.</p>
            {isLoading && <Loading />}
            {offTopic && !isLoading && <OffTopicNudge message={offTopic.message} suggestions={offTopic.suggestions} isLoading={isLoading} onSuggestion={handleGoalChange} />}
            {error && <ErrorDisplay message={error} requestId={errorRequestId} onRetry={() => void composeCart()} />}
            {!isLoading && !error && !offTopic && !result && <section className="empty-panel"><div className="eyebrow">Ready to compose</div><h2>Start with a goal.</h2><p>Forage will show the selected items, budget math, tool trace, and any catalog gaps.</p></section>}
            {result && !isLoading && <div className="enriched-result-stack">
              <ConstraintChips entries={result.decision_log} />
              <CartDisplay cart={result} products={catalog} />
              <GapReport gaps={result.gap_report} products={catalog} />
              <DecisionLog entries={result.decision_log} />
              <QueryStats cart={result} />
              <ExportButton cart={result} />
            </div>}
          </section>
        </div>
      </section>
      <footer className="site-footer">Forage Build Week 2026 · Raw catalog evidence, enriched agent decisions</footer>
    </main>
  );
}
