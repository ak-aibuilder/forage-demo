import type { CartState } from "../cart-state.js";
import type { EnrichedIndex } from "../../shared/types.js";
import { traced } from "./trace.js";

export interface AddToCartArgs { product_id: string; justification: string; slot: string; }
export interface AddToCartResult { success: boolean; cart_total: number; budget_remaining: number; }

/** Adds a catalog product once and enforces the request-scoped hard budget. */
export function addToCart(index: EnrichedIndex, state: CartState, args: AddToCartArgs): AddToCartResult {
  return traced(state, "add_to_cart", args, () => {
    const product = index.products.find((candidate) => candidate.handle === args.product_id);
    if (!product) throw new Error(`Unknown product: ${args.product_id}`);
    if (!args.justification.trim() || !args.slot.trim()) throw new Error("justification and slot must be non-empty");
    state.add({ product_id: product.handle, title: product.title, price: product.price, justification: args.justification, slot: args.slot });
    return { success: true, cart_total: state.totalPrice, budget_remaining: state.budgetRemaining };
  });
}
