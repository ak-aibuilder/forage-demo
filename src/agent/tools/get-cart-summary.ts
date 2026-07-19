import type { CartState } from "../cart-state.js";
import type { CartOutput } from "../../shared/types.js";
import { traced } from "./trace.js";

/** Deliberately excludes decision_log, matching the tool return contract. */
export function getCartSummary(state: CartState): Omit<CartOutput, "decision_log"> {
  return traced(state, "get_cart_summary", {}, () => state.summary());
}
