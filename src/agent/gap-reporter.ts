import type { GapReportEntry } from "../shared/types.js";

export interface ClosestProductSummary {
  title: string;
  price: number;
}

export function createGapReport(slot: string, budgetRemaining: number, reason: string, closest?: ClosestProductSummary, minimumViablePrice?: number): GapReportEntry {
  const viablePrice = minimumViablePrice ?? Math.max(0, budgetRemaining);
  const closestDetail = closest ? ` Closest available option: ${closest.title} at $${closest.price.toFixed(2)}.` : " No close catalog option was available.";
  const minimumCostDetail = minimumViablePrice !== undefined && minimumViablePrice > budgetRemaining
    ? ` The minimum viable catalog cost is $${minimumViablePrice.toFixed(2)}.`
    : "";
  return {
    missing_attribute_or_category: slot,
    recommendation: `${reason}${closestDetail}${minimumCostDetail} Catalog recommendation: add a compatible ${slot} priced at or below $${viablePrice.toFixed(2)}.`,
    min_viable_price: viablePrice,
  };
}
