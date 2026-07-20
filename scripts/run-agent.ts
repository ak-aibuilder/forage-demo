import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { CartAgent } from "../src/agent/index.js";
import type { InventoryConfig } from "../src/agent/tools/check-inventory.js";
import type { EnrichedIndex } from "../src/shared/types.js";

async function main(): Promise<void> {
  try { loadEnvFile(".env"); } catch { /* Deployment environments may supply variables directly. */ }

  const cliArgs = process.argv.slice(2);
  const allInStock = cliArgs.includes("--all-in-stock");
  const rawGoal = cliArgs.filter((argument) => argument !== "--all-in-stock").join(" ").trim();
  if (!rawGoal) throw new Error('Usage: npm run agent -- [--all-in-stock] "business casual outfit for a job interview, budget $150"');
  const budgetMatch = rawGoal.match(/(?:budget|under|max(?:imum)?|up to)\s*(?:is|of|:)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ?? rawGoal.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : Number(process.env.FORAGE_DEFAULT_BUDGET ?? 150);
  if (!Number.isFinite(budget) || budget < 0) throw new Error("A valid non-negative budget is required.");

  const indexPath = resolve(process.cwd(), process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json");
  const inventoryPath = resolve(process.cwd(), process.env.FORAGE_INVENTORY_PATH ?? "data/inventory-config.json");
  const index = JSON.parse(await readFile(indexPath, "utf8")) as EnrichedIndex;
  const inventory = allInStock ? {} : JSON.parse(await readFile(inventoryPath, "utf8")) as InventoryConfig;
  const agent = new CartAgent(index, budget, inventory, {
    apiKey: process.env.OPENAI_API_KEY,
    apiBaseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.FORAGE_AGENT_MODEL ?? "gpt-5.6-sol",
  });

  console.log(JSON.stringify(await agent.run(rawGoal), null, 2));
}

void main();
