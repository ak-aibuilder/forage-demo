import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CartAgent } from "../../../src/agent/index.js";
import type { InventoryConfig } from "../../../src/agent/tools/check-inventory.js";
import type { EnrichedIndex } from "../../../src/shared/types.js";

export const runtime = "nodejs";

interface CartRequestBody {
  goal?: unknown;
  allInStock?: unknown;
}

async function runWithTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("The cart agent timed out. Please try again.")), timeoutMs);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as CartRequestBody;
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (!goal) return Response.json({ error: "Enter a shopping goal before composing a cart." }, { status: 400 });

    const root = process.cwd();
    const indexPath = resolve(root, process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json");
    const inventoryPath = resolve(root, process.env.FORAGE_INVENTORY_PATH ?? "data/inventory-config.json");
    const [indexText, inventoryText] = await Promise.all([readFile(indexPath, "utf8"), readFile(inventoryPath, "utf8")]);
    const index = JSON.parse(indexText) as EnrichedIndex;
    const inventory = body.allInStock ? {} : JSON.parse(inventoryText) as InventoryConfig;
    const budgetMatch = goal.match(/(?:budget|under|max(?:imum)?|up to)\s*(?:is|of|:)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ?? goal.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : Number(process.env.FORAGE_DEFAULT_BUDGET ?? 150);
    if (!Number.isFinite(budget) || budget < 0) return Response.json({ error: "Use a valid non-negative budget." }, { status: 400 });

    const agent = new CartAgent(index, budget, inventory, {
      apiKey: process.env.OPENAI_API_KEY,
      apiBaseUrl: process.env.OPENAI_BASE_URL,
      model: process.env.FORAGE_AGENT_MODEL ?? "gpt-5.6-sol",
    });
    return Response.json(await runWithTimeout(agent.run(goal), 120_000));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The cart agent could not complete this request.";
    const status = /timed out/i.test(message) ? 504 : 500;
    return Response.json({ error: message }, { status });
  }
}
