import type { RawProduct } from "./types.js";

const STOP_WORDS = new Set([
  "a", "an", "and", "for", "the", "my", "under", "budget", "need", "outfit",
  "of", "to", "with", "me", "is", "up", "build", "compose", "cart",
]);

export interface RawSearchResult {
  product_id: string;
  title: string;
  price: number;
  bodyHtml: string;
  imageSrc: string;
  match_score: number;
  matched_keywords: string[];
}

function tokenize(goal: string): string[] {
  return [...new Set(
    (goal.toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d+$/.test(token)),
  )];
}

/** Deterministic baseline search over raw catalog text only. */
export function rawSearch(goal: string, products: RawProduct[], limit = 5): RawSearchResult[] {
  const keywords = tokenize(goal);
  if (!keywords.length || limit <= 0) return [];

  return products
    .map((product) => {
      const searchableText = [product.title, product.bodyHtml, ...product.tags].join(" ").toLowerCase();
      const matchedKeywords = keywords.filter((keyword) => searchableText.includes(keyword));
      return {
        product_id: product.handle,
        title: product.title,
        price: product.price,
        bodyHtml: product.bodyHtml,
        imageSrc: product.imageSrc,
        match_score: matchedKeywords.length,
        matched_keywords: matchedKeywords,
      };
    })
    .filter((result) => result.match_score > 0)
    .sort((left, right) => right.match_score - left.match_score || left.title.localeCompare(right.title))
    .slice(0, Math.min(5, Math.max(3, limit)));
}
