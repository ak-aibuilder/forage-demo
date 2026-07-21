import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CartAgent } from "../../../src/agent/index.js";
import type { InventoryConfig } from "../../../src/agent/tools/check-inventory.js";
import type { EnrichedIndex } from "../../../src/shared/types.js";
import { isCommerceGoal } from "../../../src/shared/commerce-goal.js";
import { publicCartError } from "../../../src/shared/public-cart-error.js";
import { deriveQueryStats } from "../../../src/shared/query-stats.js";

export const runtime = "nodejs";

interface CartRequestBody {
  goal?: unknown;
  allInStock?: unknown;
}

const OFF_TOPIC_RESPONSE = {
  error: "off_topic",
  message: "Forage composes shopping carts from product catalogs. Try a goal like 'business casual outfit for a job interview, budget $150'.",
  suggestions: [
    "business casual outfit for a job interview, budget $150",
    "weekend casual look, keep it under $80",
    "formal evening outfit under $60",
  ],
} as const;

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
  const requestId = crypto.randomUUID();
  const respond = (body: object, status = 200): Response => Response.json(body, { status, headers: { "X-Request-Id": requestId } });
  try {
    const body = await request.json() as CartRequestBody;
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (!isCommerceGoal(goal)) return respond({ ...OFF_TOPIC_RESPONSE, requestId }, 400);

    const root = process.cwd();
    const indexPath = resolve(root, process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json");
    const inventoryPath = resolve(root, process.env.FORAGE_INVENTORY_PATH ?? "data/inventory-config.json");
    const [indexText, inventoryText] = await Promise.all([readFile(indexPath, "utf8"), readFile(inventoryPath, "utf8")]);
    const index = JSON.parse(indexText) as EnrichedIndex;
    const inventory = body.allInStock ? {} : JSON.parse(inventoryText) as InventoryConfig;
    const budgetMatch = goal.match(/(?:budget|under|max(?:imum)?|up to)\s*(?:is|of|:)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ?? goal.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : Number(process.env.FORAGE_DEFAULT_BUDGET ?? 150);
    if (!Number.isFinite(budget) || budget < 0) return respond({ error: "Use a valid non-negative budget.", requestId }, 400);

    const agent = new CartAgent(index, budget, inventory, {
      apiKey: process.env.OPENAI_API_KEY,
      apiBaseUrl: process.env.OPENAI_BASE_URL,
      model: process.env.FORAGE_AGENT_MODEL ?? "gpt-5.6-sol",
      requestId,
    });
    const cart = await runWithTimeout(agent.run(goal), 120_000);
    return respond({ ...cart, stats: deriveQueryStats(cart.decision_log) });
  } catch (error) {
    const failure = publicCartError(error);
    console.error(JSON.stringify({ event: "cart.request.failed", requestId, status: failure.status, error: failure.message }));
    return respond({ error: failure.message, requestId }, failure.status);
  }
}
