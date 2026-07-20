import type { CartOutput } from "../../shared/types.js";

export function CartDisplay({ cart }: { cart: CartOutput }) {
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
        {cart.items.map((item) => (
          <article className="cart-item" key={item.product_id}>
            <div className="item-topline"><span className="slot-label">{item.slot}</span><strong>${item.price.toFixed(2)}</strong></div>
            <h3>{item.title}</h3>
            <p>{item.justification}</p>
          </article>
        ))}
      </div> : <p className="empty-copy">The agent did not add products. Review the gap report for the missing catalog capability.</p>}
      <dl className="budget-grid">
        <div><dt>Cart total</dt><dd>${cart.total_price.toFixed(2)}</dd></div>
        <div><dt>Budget</dt><dd>${cart.budget_limit.toFixed(2)}</dd></div>
        <div className={cart.budget_remaining < 0 ? "budget-warning" : "budget-good"}><dt>Remaining</dt><dd>${cart.budget_remaining.toFixed(2)}</dd></div>
      </dl>
    </section>
  );
}
