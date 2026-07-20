import type { EnrichedIndex } from "../../shared/types.js";
import { CartState, type RunTraceContext } from "../cart-state.js";
import { addToCart, type AddToCartArgs } from "./add-to-cart.js";
import { checkInventory, type CheckInventoryArgs, type InventoryConfig } from "./check-inventory.js";
import { findSubstitutes, type FindSubstitutesArgs } from "./find-substitutes.js";
import { getCartSummary } from "./get-cart-summary.js";
import { TOOL_SCHEMAS } from "./schemas.js";
import { searchCatalog, type SearchCatalogArgs } from "./search-catalog.js";
import { normalizeEnrichedIndex } from "./normalize-index.js";

export { TOOL_SCHEMAS } from "./schemas.js";
export { searchCatalog } from "./search-catalog.js";
export { checkInventory } from "./check-inventory.js";
export { findSubstitutes } from "./find-substitutes.js";
export { addToCart } from "./add-to-cart.js";
export { getCartSummary } from "./get-cart-summary.js";

/** Creates the five controlled handlers and one request-scoped cart state. */
export function createAgentTools(index: EnrichedIndex, budgetLimit: number, inventory: InventoryConfig = {}, traceContext?: RunTraceContext): {
  state: CartState;
  schemas: typeof TOOL_SCHEMAS;
  search_catalog: (args: SearchCatalogArgs) => ReturnType<typeof searchCatalog>;
  check_inventory: (args: CheckInventoryArgs) => ReturnType<typeof checkInventory>;
  find_substitutes: (args: FindSubstitutesArgs) => ReturnType<typeof findSubstitutes>;
  add_to_cart: (args: AddToCartArgs) => ReturnType<typeof addToCart>;
  get_cart_summary: () => ReturnType<typeof getCartSummary>;
} {
  const state = new CartState(budgetLimit);
  if (traceContext) state.setRunTraceContext(traceContext);
  const normalizedIndex = normalizeEnrichedIndex(index);
  return {
    state,
    schemas: TOOL_SCHEMAS,
    search_catalog: (args) => searchCatalog(normalizedIndex, args, state),
    check_inventory: (args) => checkInventory(inventory, args, state),
    find_substitutes: (args) => findSubstitutes(normalizedIndex, inventory, args, state),
    add_to_cart: (args) => addToCart(normalizedIndex, state, args),
    get_cart_summary: () => getCartSummary(state),
  };
}
