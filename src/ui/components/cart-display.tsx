import type { CartOutput, EnrichedProduct } from "../../shared/types.js";

interface CartDisplayProps {
  cart: CartOutput;
  products: EnrichedProduct[];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function Values({ values }: { values: string[] }) {
  return values.length ? <div className="tag-list">{values.map((value) => <span key={value}>{value}</span>)}</div> : <span className="attribute-empty">None recorded</span>;
}

export function CartDisplay({ cart, products }: CartDisplayProps) {
  return (
    <section className="cart-panel" aria-labelledby="cart-heading">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Composed cart</div>
          <h2 id="cart-heading">{cart.items.length ? `${cart.items.length} selected items` : "No cart items selected"}</h2>
        </div>
        <div className="total-pill">${cart.total_price.toFixed(2)}</div>
      </div>
      {cart.items.length > 0 ? <div className="item-list">
        {cart.items.map((item) => {
          const product = products.find((candidate) => candidate.handle === item.product_id);
          return (
          <article className="cart-item" key={item.product_id}>
            <div className="item-topline"><span className="slot-label">{item.slot}</span><strong>${item.price.toFixed(2)}</strong></div>
            <h3>{item.title}</h3>
            <p>{item.justification}</p>
            {product && <details className="product-comparison">
              <summary>See raw catalog data vs enriched attributes</summary>
              <div className="comparison-grid">
                <section className="raw-catalog-data" aria-label={`Raw catalog data for ${product.title}`}>
                  <div className="comparison-label">What the CSV had</div>
                  <h4>Raw catalog</h4>
                  <dl>
                    <div><dt>Title</dt><dd>{product.title}</dd></div>
                    <div><dt>Description</dt><dd>{stripHtml(product.bodyHtml) || "No description provided."}</dd></div>
                    <div><dt>Tags</dt><dd><Values values={product.tags} /></dd></div>
                    <div><dt>Price</dt><dd>${product.price.toFixed(2)}</dd></div>
                  </dl>
                </section>
                <section className="enriched-product-data" aria-label={`Enriched attributes for ${product.title}`}>
                  <div className="comparison-label">What the agent used</div>
                  <h4>Enriched attributes</h4>
                  <dl>
                    <div><dt>Use cases</dt><dd><Values values={product.useCaseTags} /></dd></div>
                    <div><dt>Style</dt><dd><Values values={product.aestheticStyle} /></dd></div>
                    <div><dt>Functional</dt><dd><Values values={product.functionalAttributes} /></dd></div>
                    <div><dt>Material</dt><dd><Values values={product.materialComposition} /></dd></div>
                    <div><dt>Confidence</dt><dd className="confidence-list">{Object.entries(product.confidenceScores).map(([attribute, score]) => <span key={attribute}>{attribute}: {score.toFixed(2)}</span>)}</dd></div>
                    <div><dt>Substitutes</dt><dd><Values values={product.substituteCandidates} /></dd></div>
                  </dl>
                </section>
              </div>
            </details>}
          </article>
          );
        })}
      </div> : <p className="empty-copy">The agent did not add products. Review the gap report for the missing catalog capability.</p>}
      <dl className="budget-grid">
        <div><dt>Cart total</dt><dd>${cart.total_price.toFixed(2)}</dd></div>
        <div><dt>Budget</dt><dd>${cart.budget_limit.toFixed(2)}</dd></div>
        <div className={cart.budget_remaining < 0 ? "budget-warning" : "budget-good"}><dt>Remaining</dt><dd>${cart.budget_remaining.toFixed(2)}</dd></div>
      </dl>
    </section>
  );
}
