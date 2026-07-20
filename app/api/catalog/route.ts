import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { EnrichedIndex } from "../../../src/shared/types.js";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const indexPath = resolve(process.cwd(), process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8")) as EnrichedIndex;
    return Response.json(index, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    console.error(JSON.stringify({ event: "catalog.request.failed", error: error instanceof Error ? error.message : "Unknown error" }));
    return Response.json({ error: "The product catalog is unavailable. Please refresh the page." }, { status: 500 });
  }
}
