import type { GapReportEntry } from "../shared/types.js";

export function createGapReport(slot: string, budgetRemaining: number, reason: string): GapReportEntry {
  return {
    missing_attribute_or_category: slot,
    recommendation: `${reason} Add a compatible ${slot} priced at or below $${Math.max(0, budgetRemaining).toFixed(2)} to the catalog.`,
    min_viable_price: Math.max(0, budgetRemaining),
  };
}
