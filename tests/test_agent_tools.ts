import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createAgentTools } from "../src/agent/tools/index.js";
import type { InventoryConfig } from "../src/agent/tools/check-inventory.js";
import type { EnrichedIndex } from "../src/shared/types.js";

const enrichedIndex = JSON.parse(readFileSync(join(process.cwd(), "data", "enriched-index.json"), "utf8")) as EnrichedIndex;
const inventory = JSON.parse(readFileSync(join(process.cwd(), "data", "inventory-config.json"), "utf8")) as InventoryConfig;

test("search_catalog returns the interview-ready enriched product", () => {
  const tools = createAgentTools(enrichedIndex, 150, inventory);
  const results = tools.search_catalog({ use_case: "job_interview", aesthetic_style: "polished", price_min: null, price_max: 150, functional_attributes: ["button_front"], keyword: null });
  expect(results.map((product) => product.handle)).toEqual(["white-cotton-shirt"]);
});

test("inventory config exposes the demo stockouts", () => {
  const tools = createAgentTools(enrichedIndex, 150, inventory);
  expect(tools.check_inventory({ product_id: "white-cotton-shirt" })).toEqual({ product_id: "white-cotton-shirt", in_stock: false, quantity: 0 });
  expect(tools.check_inventory({ product_id: "black-leather-bag" }).in_stock).toBe(false);
});

test("find_substitutes ranks an available compatible alternative", () => {
  const tools = createAgentTools(enrichedIndex, 150, inventory);
  const alternatives = tools.find_substitutes({ product_id: "white-cotton-shirt", match_use_case: true, max_price: 60 });
  expect(alternatives[0]).toMatchObject({ price: expect.any(Number) });
  expect(alternatives[0]?.price).toBeLessThanOrEqual(60);
  expect(/shirt|blouse|top|tee/i.test(alternatives[0]?.title ?? "")).toBe(true);
  expect(alternatives).not.toContainEqual(expect.objectContaining({ handle: "white-cotton-shirt" }));
});

test("cart additions, summary, and trace preserve the shared budget", () => {
  const tools = createAgentTools(enrichedIndex, 150, inventory);
  tools.add_to_cart({ product_id: "longsleeve-cotton-top", justification: "available neutral interview top", slot: "top" });
  tools.add_to_cart({ product_id: "olive-green-jacket", justification: "available business-casual outer layer", slot: "outer_layer" });
  const summary = tools.get_cart_summary();
  expect(summary).toMatchObject({ total_price: 115, budget_limit: 150, budget_remaining: 35 });
  expect(summary.items.map((item) => item.slot)).toEqual(["top", "outer_layer"]);
  expect("decision_log" in summary).toBe(false);
  expect(tools.state.output().decision_log.map((entry) => entry.tool_called)).toEqual(["add_to_cart", "add_to_cart", "get_cart_summary"]);
});
