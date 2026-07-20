import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CartAgent, type AgentResponse, type AgentTransport } from "../src/agent/index.js";
import type { InventoryConfig } from "../src/agent/tools/check-inventory.js";
import type { CartOutput, EnrichedIndex } from "../src/shared/types.js";

const index = JSON.parse(readFileSync(resolve(process.cwd(), "data/enriched-index.json"), "utf8")) as EnrichedIndex;

const call = (name: string, args: Record<string, unknown>, indexNumber: number): AgentResponse => ({
  output: [{ type: "function_call", name, arguments: JSON.stringify(args), call_id: `call-${indexNumber}` }],
});

function scriptedTransport(script: AgentResponse[]): AgentTransport {
  let next = 0;
  return async () => {
    const response = script[next++];
    if (!response) throw new Error("The agent made more model requests than the test script expected.");
    return response;
  };
}

export async function runInterviewAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: "business_casual", aesthetic_style: null, price_min: null, price_max: 150, functional_attributes: null, keyword: "shirt" }, 1),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 2),
    call("add_to_cart", { product_id: "white-cotton-shirt", justification: "A neutral polished business-casual base.", slot: "shirt" }, 3),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 120, functional_attributes: null, keyword: "jacket" }, 4),
    call("check_inventory", { product_id: "navy-sport-jacket" }, 5),
    call("add_to_cart", { product_id: "navy-sport-jacket", justification: "A coordinated navy outer layer for the interview.", slot: "outer layer" }, 6),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 60, functional_attributes: null, keyword: "bag" }, 7),
    call("check_inventory", { product_id: "black-leather-bag" }, 8),
    call("add_to_cart", { product_id: "black-leather-bag", justification: "A restrained black accessory that completes the outfit.", slot: "bag" }, 9),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 150, {}, { transport: scriptedTransport(script) })
    .run("business casual outfit for a job interview, budget $150");
}

export async function runOverBudgetAgent(): Promise<CartOutput> {
  const script = [
    call("check_inventory", { product_id: "blue-silk-tuxedo" }, 1),
    call("add_to_cart", { product_id: "blue-silk-tuxedo", justification: "A polished top option.", slot: "top" }, 2),
    call("check_inventory", { product_id: "led-high-tops" }, 3),
    call("add_to_cart", { product_id: "led-high-tops", justification: "A footwear option.", slot: "footwear" }, 4),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 100, {}, { transport: scriptedTransport(script) })
    .run("a top and footwear under $100");
}

export async function runSubstitutionAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 150, functional_attributes: null, keyword: "shirt" }, 1),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 2),
    call("find_substitutes", { product_id: "white-cotton-shirt", match_use_case: true, max_price: 60 }, 3),
    call("check_inventory", { product_id: "longsleeve-cotton-top" }, 4),
    call("add_to_cart", { product_id: "longsleeve-cotton-top", justification: "Available minimalist cotton substitute for the unavailable interview shirt.", slot: "shirt" }, 5),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 100, functional_attributes: null, keyword: "jacket" }, 6),
    call("check_inventory", { product_id: "navy-sport-jacket" }, 7),
    call("add_to_cart", { product_id: "navy-sport-jacket", justification: "Navy outer layer that coordinates with the substitute shirt.", slot: "outer layer" }, 8),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 40, functional_attributes: null, keyword: "bag" }, 9),
    call("check_inventory", { product_id: "black-leather-bag" }, 10),
    call("add_to_cart", { product_id: "black-leather-bag", justification: "Neutral professional bag within the revised budget.", slot: "bag" }, 11),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 150, { "white-cotton-shirt": { quantity: 0 } }, { transport: scriptedTransport(script) })
    .run("a business casual interview outfit under $150");
}

export async function runSubstituteBudgetConflictAgent(): Promise<CartOutput> {
  const inventory = Object.fromEntries(index.products.map((product) => [product.handle, { quantity: 0 }])) as InventoryConfig;
  inventory["navy-sport-jacket"] = { quantity: 1 };
  inventory["black-leather-bag"] = { quantity: 1 };
  inventory["classic-varsity-top"] = { quantity: 1 };
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 130, functional_attributes: null, keyword: "jacket" }, 1),
    call("check_inventory", { product_id: "navy-sport-jacket" }, 2),
    call("add_to_cart", { product_id: "navy-sport-jacket", justification: "Selected outer layer.", slot: "outer layer" }, 3),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 70, functional_attributes: null, keyword: "bag" }, 4),
    call("check_inventory", { product_id: "black-leather-bag" }, 5),
    call("add_to_cart", { product_id: "black-leather-bag", justification: "Selected interview bag.", slot: "bag" }, 6),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 40, functional_attributes: null, keyword: "shirt" }, 7),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 8),
    call("find_substitutes", { product_id: "white-cotton-shirt", match_use_case: true, max_price: 60 }, 9),
    call("check_inventory", { product_id: "classic-varsity-top" }, 10),
    call("add_to_cart", { product_id: "classic-varsity-top", justification: "Attempt the only available shirt substitute.", slot: "shirt" }, 11),
    call("find_substitutes", { product_id: "white-cotton-shirt", match_use_case: true, max_price: 40 }, 12),
    call("get_cart_summary", {}, 13),
  ];
  return new CartAgent(index, 130, inventory, { transport: scriptedTransport(script) })
    .run("a shirt, outer layer, and bag under $130");
}

export async function runFormalGapAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 60, functional_attributes: null, keyword: "gown" }, 1),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: null, functional_attributes: null, keyword: "gown" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 60, {}, { transport: scriptedTransport(script) })
    .run("a formal evening gown under $60");
}

export async function runWaterproofGapAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 20, functional_attributes: ["waterproof"], keyword: "cotton shirt" }, 1),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 20, functional_attributes: null, keyword: "cotton shirt" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 20, {}, { transport: scriptedTransport(script) })
    .run("a waterproof cotton shirt under $20");
}
