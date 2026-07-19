import { join } from "node:path";
import { mergeEnrichment } from "../src/enrichment/enricher.js";
import { parseCatalogFile } from "../src/enrichment/parser.js";
import type { RawProduct } from "../src/shared/types.js";

test("test_parser_produces_correct_product_count", async () => {
  /**
   * Expect the apparel.csv parser to produce 20 products, collapsing variant
   * rows that belong to the same product handle.
   */
  const products = await parseCatalogFile(join(process.cwd(), "data", "apparel.csv"));

  expect(products).toHaveLength(20);
  expect(products.find((product) => product.handle === "classic-varsity-top")?.variants).toHaveLength(3);
});

test("test_enriched_product_has_required_fields", () => {
  /**
   * Expect each enriched product to include confidence_scores, use_case_tags,
   * and aesthetic_style before it is added to the EnrichedIndex.
   */
  const enriched = mergeEnrichment(productFixture(), {
    materialComposition: ["cotton"],
    useCaseTags: ["casual"],
    aestheticStyle: ["classic"],
    seasonalRelevance: [],
    functionalAttributes: ["long_sleeves"],
    substituteCandidates: ["other-shirt"],
    confidenceScores: {
      "materialComposition.cotton": 1,
      "useCaseTags.casual": 0.7,
      "aestheticStyle.classic": 0.7,
      "functionalAttributes.long_sleeves": 1
    }
  }, ["fixture-shirt", "other-shirt"]);

  expect(enriched.confidenceScores).toBeDefined();
  expect(enriched.useCaseTags).toEqual(["casual"]);
  expect(enriched.aestheticStyle).toEqual(["classic"]);
  expect(enriched.substituteCandidates).toEqual(["other-shirt"]);
});

test("test_title_only_product_has_low_confidence", () => {
  /**
   * Expect a product with an empty description to receive confidence scores
   * below 0.5 for every inferred enrichment.
   */
  const enriched = mergeEnrichment({ ...productFixture(), bodyHtml: "" }, {
    materialComposition: [],
    useCaseTags: ["casual"],
    aestheticStyle: ["classic"],
    seasonalRelevance: [],
    functionalAttributes: [],
    substituteCandidates: [],
    confidenceScores: { "useCaseTags.casual": 0.7, "aestheticStyle.classic": 0.8 }
  }, ["fixture-shirt"]);

  expect(Object.values(enriched.confidenceScores).every((score) => score < 0.5)).toBe(true);
});

function productFixture(): RawProduct {
  const variant = {
    sku: "",
    optionValues: ["Default Title"],
    grams: 0,
    inventoryTracker: "",
    inventoryQuantity: 1,
    inventoryPolicy: "deny",
    fulfillmentService: "manual",
    price: 30,
    compareAtPrice: null,
    requiresShipping: true,
    taxable: true,
    barcode: "",
    image: "",
    weightUnit: "kg",
    taxCode: ""
  };

  return {
    handle: "fixture-shirt",
    title: "Fixture Shirt",
    bodyHtml: "Cotton shirt with long sleeves.",
    vendor: "partners-demo",
    type: "",
    tags: ["men"],
    price: 30,
    imageSrc: "",
    variant,
    variants: [variant]
  };
}
