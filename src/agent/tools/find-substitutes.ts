import type { CartState } from "../cart-state.js";
import type { EnrichedIndex, EnrichedProduct } from "../../shared/types.js";
import { inventoryQuantity, type InventoryConfig } from "./check-inventory.js";
import { traced } from "./trace.js";

export interface FindSubstitutesArgs { product_id: string; match_use_case: boolean | null; max_price: number | null; }

const overlap = (left: string[], right: string[]) => left.filter((value) => right.map((item) => item.toLowerCase()).includes(value.toLowerCase())).length;
const category = (product: EnrichedProduct) => {
  const text = `${product.title} ${product.bodyHtml}`.toLowerCase();
  if (/bag/.test(text)) return "bag";
  if (/jacket|tuxedo|jumper/.test(text)) return "outerwear";
  if (/shirt|blouse|top|tee/.test(text)) return "top";
  if (/skirt|pants/.test(text)) return "bottom";
  if (/shoe|tops/.test(text)) return "footwear";
  return "other";
};

/** Returns only in-stock alternatives, ordered by category, tags/style compatibility, then price distance. */
export function findSubstitutes(index: EnrichedIndex, inventory: InventoryConfig, args: FindSubstitutesArgs, state?: CartState): EnrichedProduct[] {
  return traced(state, "find_substitutes", args, () => {
    const original = index.products.find((product) => product.handle === args.product_id);
    if (!original) throw new Error(`Unknown product: ${args.product_id}`);
    return index.products
      .filter((product) => product.handle !== original.handle && inventoryQuantity(inventory, product.handle) > 0)
      .filter((product) => args.max_price === null || product.price <= args.max_price)
      .map((product) => ({ product, score: (category(product) === category(original) ? 8 : 0) + (args.match_use_case === false ? 0 : overlap(product.useCaseTags, original.useCaseTags) * 3) + overlap(product.aestheticStyle, original.aestheticStyle) * 2 - Math.abs(product.price - original.price) / 100 }))
      .sort((left, right) => right.score - left.score || left.product.price - right.product.price || left.product.handle.localeCompare(right.product.handle))
      .map(({ product }) => product);
  });
}
