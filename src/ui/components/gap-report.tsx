import type { GapReportEntry } from "../../shared/types.js";

export function GapReport({ gaps }: { gaps: GapReportEntry[] }) {
  if (!gaps.length) return null;
  return (
    <section className="gap-panel" aria-labelledby="gap-heading">
      <div className="eyebrow">Catalog gap</div>
      <h2 id="gap-heading">The agent found a truthful limit.</h2>
      {gaps.map((gap) => <article className="gap-item" key={`${gap.missing_attribute_or_category}-${gap.min_viable_price}`}>
        <h3>{gap.missing_attribute_or_category}</h3>
        <p>{gap.recommendation}</p>
        <span>Minimum viable budget: {gap.min_viable_price === null ? "Not available" : `$${gap.min_viable_price.toFixed(2)}`}</span>
      </article>)}
    </section>
  );
}
