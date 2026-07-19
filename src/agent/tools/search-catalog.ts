import type { CartState } from "../cart-state.js";
import type { EnrichedIndex, EnrichedProduct } from "../../shared/types.js";
import { traced } from "./trace.js";

export interface SearchCatalogArgs {
  use_case: string | null;
  aesthetic_style: string | null;
  price_min: number | null;
  price_max: number | null;
  functional_attributes: string[] | null;
  keyword: string | null;
}

const includesTerm = (values: string[], term: string) => values.some((value) => value.toLowerCase() === term.toLowerCase());

/** Searches only structured enriched data; all supplied filters are conjunctive. */
export function searchCatalog(index: EnrichedIndex, args: SearchCatalogArgs, state?: CartState): EnrichedProduct[] {
  return traced(state, "search_catalog", args, () => index.products.filter((product) => {
    if (args.use_case && !includesTerm(product.useCaseTags, args.use_case)) return false;
    if (args.aesthetic_style && !includesTerm(product.aestheticStyle, args.aesthetic_style)) return false;
    if (args.price_min !== null && product.price < args.price_min) return false;
    if (args.price_max !== null && product.price > args.price_max) return false;
    if (args.functional_attributes && !args.functional_attributes.every((attribute) => includesTerm(product.functionalAttributes, attribute))) return false;
    if (args.keyword) {
      const haystack = [product.handle, product.title, product.bodyHtml, ...product.tags, ...product.materialComposition, ...product.useCaseTags, ...product.aestheticStyle, ...product.functionalAttributes].join(" ").toLowerCase();
      if (!args.keyword.toLowerCase().split(/\s+/).every((term) => haystack.includes(term))) return false;
    }
    return true;
  }));
}
