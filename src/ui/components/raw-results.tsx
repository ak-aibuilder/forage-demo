import type { RawSearchResult } from "../../shared/raw-search.js";

interface RawResultsProps {
  results: RawSearchResult[];
  isLoading: boolean;
  error?: string;
  hasRun: boolean;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function RawResults({ results, isLoading, error, hasRun }: RawResultsProps) {
  return (
    <section className="raw-results" aria-labelledby="raw-results-heading">
      <div className="comparison-side-label">Without Enrichment</div>
      <h3 id="raw-results-heading">Naive keyword search</h3>
      <p className="comparison-limit">No constraint awareness. No substitution. No budget tracking.</p>

      {!hasRun && <div className="comparison-empty">Compose a cart to see what raw keyword matching returns.</div>}
      {isLoading && <div className="raw-loading">Matching words in raw catalog text...</div>}
      {error && <div className="raw-error" role="alert">{error}</div>}
      {hasRun && !isLoading && !error && results.length === 0 && <div className="comparison-empty">No products matched the goal keywords.</div>}

      {!isLoading && !error && results.length > 0 && <div className="raw-result-list">
        {results.map((result) => (
          <article className="raw-result-card" key={result.product_id}>
            {result.imageSrc
              ? <img className="result-thumbnail" src={result.imageSrc} alt="" />
              : <div className="result-thumbnail result-thumbnail-empty" aria-hidden="true">{result.title.charAt(0)}</div>}
            <div className="raw-result-copy">
              <div className="raw-result-topline"><h4>{result.title}</h4><strong>${result.price.toFixed(2)}</strong></div>
              <p>{stripHtml(result.bodyHtml) || "No description provided."}</p>
              <div className="keyword-row" aria-label="Matched keywords">
                {result.matched_keywords.map((keyword) => <mark key={keyword}>{keyword}</mark>)}
              </div>
              <span className="match-score">{result.match_score} keyword {result.match_score === 1 ? "match" : "matches"}</span>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}
