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

export async function runLowBudgetAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 10, functional_attributes: null, keyword: "shirt" }, 1),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: null, functional_attributes: null, keyword: "shirt" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 10, {}, { transport: scriptedTransport(script), requestId: "req-low-budget" })
    .run("a shirt under $10");
}

export async function runNonsenseGapAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 100, functional_attributes: null, keyword: "purple elephant tuxedo mars" }, 1),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 100, functional_attributes: null, keyword: "elephant tuxedo mars" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 100, {}, { transport: scriptedTransport(script), requestId: "req-nonsense" })
    .run("purple elephant tuxedo for Mars under $100");
}

export async function runNonsenseApproximationAgent(): Promise<CartOutput> {
  const script = [
    call("check_inventory", { product_id: "classic-leather-jacket" }, 1),
    call("add_to_cart", { product_id: "classic-leather-jacket", justification: "Closest approximation.", slot: "outer layer" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 100, {}, { transport: scriptedTransport(script), requestId: "req-nonsense-approximation" })
    .run("purple elephant tuxedo for Mars under $100");
}

export async function runInvalidRelaxationAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 20, functional_attributes: ["waterproof"], keyword: "cotton shirt" }, 1),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 20, functional_attributes: null, keyword: "shirt" }, 2),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 20, {}, { transport: scriptedTransport(script), requestId: "req-invalid-relaxation" })
    .run("a waterproof cotton shirt under $20");
}

export async function runIterationCapAgent(): Promise<CartOutput> {
  const script = [
    call("check_inventory", { product_id: "white-cotton-shirt" }, 1),
    { ...call("add_to_cart", { product_id: "white-cotton-shirt", justification: "Partial interview base.", slot: "shirt" }, 2), usage: { input_tokens: 12, output_tokens: 8, total_tokens: 20 } },
  ];
  return new CartAgent(index, 150, {}, { transport: scriptedTransport(script), maxToolCalls: 3, requestId: "req-cap" })
    .run("a shirt, jacket, and bag for a job interview under $150");
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

export async function runCottonShirtAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 60, functional_attributes: null, keyword: "cotton shirt" }, 1),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 2),
    call("add_to_cart", { product_id: "white-cotton-shirt", justification: "Direct cotton shirt match within budget.", slot: "shirt" }, 3),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 60, {}, { transport: scriptedTransport(script), requestId: "req-cotton-shirt" })
    .run("a cotton shirt under $60");
}

export async function runBudget130Agent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 130, functional_attributes: null, keyword: "shirt" }, 1),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 2),
    call("add_to_cart", { product_id: "white-cotton-shirt", justification: "Polished interview shirt.", slot: "shirt" }, 3),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 100, functional_attributes: null, keyword: "jacket" }, 4),
    call("check_inventory", { product_id: "navy-sport-jacket" }, 5),
    call("add_to_cart", { product_id: "navy-sport-jacket", justification: "Coordinated outer layer.", slot: "outer layer" }, 6),
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 40, functional_attributes: null, keyword: "bag" }, 7),
    call("check_inventory", { product_id: "black-leather-bag" }, 8),
    call("add_to_cart", { product_id: "black-leather-bag", justification: "Professional bag within the remaining budget.", slot: "bag" }, 9),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 130, {}, { transport: scriptedTransport(script), requestId: "req-budget-130" })
    .run("a polished shirt, outer layer, and bag under $130");
}

export async function runDoubleStockoutAgent(): Promise<CartOutput> {
  const script = [
    call("search_catalog", { use_case: null, aesthetic_style: null, price_min: null, price_max: 150, functional_attributes: null, keyword: "shirt" }, 1),
    call("check_inventory", { product_id: "white-cotton-shirt" }, 2),
    call("find_substitutes", { product_id: "white-cotton-shirt", match_use_case: true, max_price: 60 }, 3),
    call("check_inventory", { product_id: "longsleeve-cotton-top" }, 4),
    call("add_to_cart", { product_id: "longsleeve-cotton-top", justification: "Available shirt substitute.", slot: "shirt" }, 5),
    call("check_inventory", { product_id: "navy-sport-jacket" }, 6),
    call("add_to_cart", { product_id: "navy-sport-jacket", justification: "Available coordinated outer layer.", slot: "outer layer" }, 7),
    call("check_inventory", { product_id: "black-leather-bag" }, 8),
    call("find_substitutes", { product_id: "black-leather-bag", match_use_case: true, max_price: 40 }, 9),
    { output: [{ type: "message", role: "assistant", content: [] }] },
  ];
  return new CartAgent(index, 150, { "white-cotton-shirt": { quantity: 0 }, "black-leather-bag": { quantity: 0 } }, { transport: scriptedTransport(script), requestId: "req-double-stockout" })
    .run("a business casual interview outfit under $150");
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
