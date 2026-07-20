"use client";

import { useMemo, useState } from "react";
import type { CartOutput } from "../../shared/types.js";

export function ExportButton({ cart }: { cart: CartOutput }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const payload = useMemo(() => ({
    items: cart.items.map((item) => ({ product_id: item.product_id, title: item.title, quantity: 1, unit_price: item.price, slot: item.slot })),
    subtotal: cart.total_price,
    budget_limit: cart.budget_limit,
    budget_remaining: cart.budget_remaining,
    constraints_met: cart.constraints_met,
    source: "forage-demo",
    timestamp: new Date().toISOString(),
  }), [cart]);

  async function writeText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Clipboard access was denied.");
    }
  }

  async function copyPayload(): Promise<void> {
    try {
      await writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2_000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section className="export-area" aria-label="Checkout payload export">
      <div className="export-copy"><strong>Ready for the next step</strong><span>Structured for agentic checkout integration</span></div>
      <details className="payload-preview">
        <summary>Preview checkout payload JSON</summary>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </details>
      <button className="export-button" type="button" onClick={() => void copyPayload()} aria-live="polite">
        {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy checkout payload"}
      </button>
    </section>
  );
}
