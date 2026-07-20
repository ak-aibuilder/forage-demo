import type { EnrichedProduct } from "../../shared/types.js";

interface CatalogBrowserProps {
  products: EnrichedProduct[];
  isLoading: boolean;
  error?: string;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function CatalogBrowser({ products, isLoading, error }: CatalogBrowserProps) {
  return (
    <section className="catalog-panel" aria-labelledby="catalog-heading">
      <div className="eyebrow">Raw Shopify catalog</div>
      <h2 id="catalog-heading">Product Catalog</h2>
      <p>This is what the raw Shopify CSV looks like. No structured attributes, no agent-queryable data.</p>
      {isLoading && <p className="catalog-status">Loading the product catalog...</p>}
      {error && <p className="catalog-status catalog-error">{error}</p>}
      {!isLoading && !error && <div className="catalog-grid">
        {products.map((product) => (
          <article className="catalog-card" key={product.handle}>
            {product.imageSrc ? <img src={product.imageSrc} alt="" className="catalog-image" /> : <div className="catalog-image catalog-image-empty">No image</div>}
            <div className="catalog-card-body">
              <div className="catalog-card-topline"><h3>{product.title}</h3><strong>${product.price.toFixed(2)}</strong></div>
              <p>{stripHtml(product.bodyHtml) || "No description provided."}</p>
              <div className="tag-list" aria-label={`${product.title} raw tags`}>
                {product.tags.length ? product.tags.map((tag) => <span key={tag}>{tag}</span>) : <span>untagged</span>}
              </div>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}
