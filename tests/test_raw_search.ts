import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rawSearch } from "../src/shared/raw-search.js";
import type { EnrichedIndex } from "../src/shared/types.js";

const index = JSON.parse(readFileSync(resolve(process.cwd(), "data/enriched-index.json"), "utf8")) as EnrichedIndex;

test("raw search ranks deterministic raw text matches without enriched attributes", () => {
  const first = rawSearch("business casual outfit for a job interview, budget $150", index.products);
  const second = rawSearch("business casual outfit for a job interview, budget $150", index.products);

  expect(first).toEqual(second);
  expect(first.length).toBeGreaterThan(0);
  expect(first.length).toBeLessThanOrEqual(5);
  expect(first.every((result) => result.match_score > 0)).toBe(true);
  expect(first).toEqual([...first].sort((left, right) => right.match_score - left.match_score || left.title.localeCompare(right.title)));
});

test("raw search returns no products when raw catalog text has no matching keywords", () => {
  expect(rawSearch("platinum spacesuit for europa", index.products)).toEqual([]);
});
