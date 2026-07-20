import type { EnrichedProduct, GapReportEntry } from "../../shared/types.js";

interface GapReportProps {
  gaps: GapReportEntry[];
  products?: EnrichedProduct[];
}

function closestProductForGap(recommendation: string, products: EnrichedProduct[]): EnrichedProduct | undefined {
  const match = recommendation.match(/Closest available option:\s*(.+?)\s+at\s+\$\d+(?:\.\d{1,2})?/i);
  if (!match) return undefined;
  const mentionedTitle = match[1].trim().toLowerCase();
  return products.find((product) => product.title.toLowerCase().includes(mentionedTitle) || mentionedTitle.includes(product.title.toLowerCase()));
}

export function GapReport({ gaps, products = [] }: GapReportProps) {
  if (!gaps.length) return null;
  return (
    <section className="gap-panel" aria-labelledby="gap-heading">
      <div className="eyebrow">Catalog gap</div>
      <h2 id="gap-heading">The agent found a truthful limit.</h2>
      {gaps.map((gap) => <article className="gap-item" key={`${gap.missing_attribute_or_category}-${gap.min_viable_price}`}>
        <h3>{gap.missing_attribute_or_category}</h3>
        <div className="gap-content">
          {(() => {
            const closest = closestProductForGap(gap.recommendation, products);
            return closest ? <div className="gap-product-card">
              {closest.imageSrc ? <img className="result-thumbnail" src={closest.imageSrc} alt="" /> : <div className="result-thumbnail result-thumbnail-empty" aria-hidden="true">{closest.title.charAt(0)}</div>}
              <div><strong>{closest.title}</strong><span>${closest.price.toFixed(2)}</span></div>
            </div> : null;
          })()}
          <div className="gap-copy">
            <p>{gap.recommendation}</p>
            <span>Minimum viable budget: {gap.min_viable_price === null ? "Not available" : `$${gap.min_viable_price.toFixed(2)}`}</span>
          </div>
        </div>
      </article>)}
    </section>
  );
}
