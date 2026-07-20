import type { GapReportEntry } from "../shared/types.js";

export interface ClosestProductSummary {
  title: string;
  price: number;
}

export function createGapReport(slot: string, budgetRemaining: number, reason: string, closest?: ClosestProductSummary): GapReportEntry {
  const closestDetail = closest ? ` Closest available option: ${closest.title} at $${closest.price.toFixed(2)}.` : " No close catalog option was available.";
  return {
    missing_attribute_or_category: slot,
    recommendation: `${reason}${closestDetail} Catalog recommendation: add a compatible ${slot} priced at or below $${Math.max(0, budgetRemaining).toFixed(2)}.`,
    min_viable_price: Math.max(0, budgetRemaining),
  };
}
