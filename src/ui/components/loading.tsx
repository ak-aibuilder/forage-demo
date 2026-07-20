export function Loading() {
  return (
    <section className="loading-panel" aria-live="polite" aria-label="Agent is composing the cart">
      <div className="loading-orb" />
      <div><div className="eyebrow">Agent working</div><h2>Checking the catalog, inventory, and shared budget.</h2><p>This can take a moment while the cart is composed.</p></div>
    </section>
  );
}
