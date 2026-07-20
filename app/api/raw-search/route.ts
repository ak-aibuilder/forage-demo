import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { rawSearch } from "../../../src/shared/raw-search.js";
import type { EnrichedIndex, RawProduct } from "../../../src/shared/types.js";

export const runtime = "nodejs";

interface RawSearchRequestBody {
  goal?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as RawSearchRequestBody;
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (!goal) return Response.json({ error: "Enter a shopping goal before searching the catalog." }, { status: 400 });

    const indexPath = resolve(process.cwd(), process.env.FORAGE_ENRICHED_INDEX_PATH ?? "data/enriched-index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8")) as EnrichedIndex;
    const rawProducts: RawProduct[] = index.products.map((product) => ({
      handle: product.handle,
      title: product.title,
      bodyHtml: product.bodyHtml,
      vendor: product.vendor,
      type: product.type,
      tags: product.tags,
      price: product.price,
      imageSrc: product.imageSrc,
      variant: product.variant,
      variants: product.variants,
    }));

    return Response.json({ results: rawSearch(goal, rawProducts) });
  } catch (error) {
    console.error(JSON.stringify({ event: "raw-search.request.failed", error: error instanceof Error ? error.message : "Unknown error" }));
    return Response.json({ error: "The raw catalog search is unavailable. Please try again." }, { status: 500 });
  }
}
