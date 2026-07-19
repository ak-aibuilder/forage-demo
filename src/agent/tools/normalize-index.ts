import type { EnrichedIndex, EnrichedProduct, RawProduct, RawVariant } from "../../shared/types.js";

type LegacyProduct = Record<string, unknown>;

const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function normalizeProduct(value: LegacyProduct): EnrichedProduct {
  const variant = (value.variant ?? {}) as RawVariant;
  const raw: RawProduct = {
    handle: String(value.handle ?? ""), title: String(value.title ?? ""), bodyHtml: String(value.bodyHtml ?? value.body_html ?? ""),
    vendor: String(value.vendor ?? ""), type: String(value.type ?? ""), tags: stringArray(value.tags), price: Number(value.price ?? 0),
    imageSrc: String(value.imageSrc ?? value.image_src ?? ""), variant, variants: Array.isArray(value.variants) ? value.variants as RawVariant[] : [variant]
  };
  return {
    ...raw,
    materialComposition: stringArray(value.materialComposition ?? value.material_composition),
    useCaseTags: stringArray(value.useCaseTags ?? value.use_case_tags),
    aestheticStyle: stringArray(value.aestheticStyle ?? value.aesthetic_style),
    seasonalRelevance: stringArray(value.seasonalRelevance ?? value.seasonal_relevance),
    functionalAttributes: stringArray(value.functionalAttributes ?? value.functional_attributes),
    substituteCandidates: stringArray(value.substituteCandidates ?? value.substitute_candidates),
    confidenceScores: (value.confidenceScores ?? value.confidence_scores ?? {}) as Record<string, number>
  };
}

/** Accepts the current camelCase contract and the earlier cached snake_case fixture. */
export function normalizeEnrichedIndex(value: EnrichedIndex | { products: LegacyProduct[] }): EnrichedIndex {
  return {
    schemaVersion: "1.0",
    sourcePath: "data/enriched-index.json",
    generatedAt: new Date(0).toISOString(),
    ...("schemaVersion" in value ? value : {}),
    products: (value.products as unknown[]).map((product) => normalizeProduct(product as LegacyProduct))
  };
}
