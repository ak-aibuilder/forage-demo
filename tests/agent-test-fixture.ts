import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CartAgent, type AgentResponse, type AgentTransport } from "../src/agent/index.js";
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
