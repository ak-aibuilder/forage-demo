"use client";

import { useState } from "react";
import type { CartOutput } from "../../shared/types.js";

export function ExportButton({ cart }: { cart: CartOutput }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

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
    const payload = {
      items: cart.items.map((item) => ({ product_id: item.product_id, title: item.title, quantity: 1, unit_price: item.price, slot: item.slot })),
      subtotal: cart.total_price,
      budget_limit: cart.budget_limit,
      budget_remaining: cart.budget_remaining,
      constraints_met: cart.constraints_met,
      source: "forage-demo",
      timestamp: new Date().toISOString(),
    };

    try {
      await writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2_000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="export-area">
      <div><strong>Ready for the next step</strong><span>Structured for agentic checkout integration</span></div>
      <button className="export-button" type="button" onClick={() => void copyPayload()} aria-live="polite">
        {copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Copy checkout payload"}
      </button>
    </div>
  );
}
