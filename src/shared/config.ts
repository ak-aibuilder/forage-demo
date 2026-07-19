import { resolve } from "node:path";

export const ENRICHMENT_MODEL = "gpt-5.6-terra";
export const ENRICHMENT_PROMPT_VERSION = "forage-enrichment-v1";

export interface ForageConfig {
  apiKey: string | undefined;
  apiBaseUrl: string;
  catalogPath: string;
  enrichedIndexPath: string;
  model: string;
}

export function getConfig(projectRoot = process.cwd()): ForageConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    apiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    catalogPath: resolve(projectRoot, process.env.FORAGE_CATALOG_PATH ?? "data/apparel.csv"),
    enrichedIndexPath: resolve(
      projectRoot,
      process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json"
    ),
    model: process.env.FORAGE_ENRICHMENT_MODEL ?? ENRICHMENT_MODEL
  };
}

export function assertApiKey(config: ForageConfig): asserts config is ForageConfig & { apiKey: string } {
  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is required to enrich the catalog.");
  }
}
