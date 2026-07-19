import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadEnvFile } from "node:process";
import { assertApiKey, getConfig, type ForageConfig } from "../shared/config.js";
import type { EnrichedIndex } from "../shared/types.js";
import { parseCatalogFile } from "./parser.js";
import { OpenAIEnrichmentProvider } from "./provider.js";

try {
  loadEnvFile(".env");
} catch {
  // Environment variables may be supplied by the shell or deployment runtime.
}

async function readCachedIndex(path: string): Promise<EnrichedIndex | null> {
  try {
    await access(path);
    return JSON.parse(await readFile(path, "utf8")) as EnrichedIndex;
  } catch {
    return null;
  }
}

async function writeIndex(path: string, index: EnrichedIndex): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(index, null, 2) + "\n", "utf8");
}

export async function loadOrCreateEnrichedIndex(config: ForageConfig = getConfig(), force = false): Promise<EnrichedIndex> {
  if (!force) {
    const cached = await readCachedIndex(config.enrichedIndexPath);
    if (cached) {
      return cached;
    }
  }

  assertApiKey(config);
  const rawProducts = await parseCatalogFile(config.catalogPath);
  if (rawProducts.length !== 20) {
    throw new Error("Expected 20 raw products, received " + rawProducts.length + ".");
  }

  const index = await new OpenAIEnrichmentProvider(config).enrich(rawProducts);
  await writeIndex(config.enrichedIndexPath, index);
  return index;
}

async function run(): Promise<void> {
  const force = process.argv.includes("--force");
  const index = await loadOrCreateEnrichedIndex(getConfig(), force);
  console.info("Enriched index ready: " + index.products.length + " products.");
}

if (process.argv[1]?.endsWith("index.ts")) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
