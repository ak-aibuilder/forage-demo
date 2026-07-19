# CSV Ingestion and Enrichment Module

## Schedule

Sunday, 10:00 AM to 11:30 AM (1.5 hours)

## Codex Model + Effort

GPT-5.6 Terra, high effort

## Objective

Parse data/apparel.csv into 20 raw product objects, enrich them with structured attributes, and persist a reusable EnrichedIndex.

## Background

Read 00_CONTEXT.md, PRD.md, AGENTS.md, data/apparel.csv, and relevant tests before coding. No implementation exists yet. The enrichment module is independent from the cart agent and must satisfy the EnrichmentProvider boundary.

## Files

Create:

- src/shared/types.ts: RawProduct, EnrichedProduct, EnrichedIndex, and EnrichmentProvider types
- src/shared/config.ts: environment, model, and path configuration
- src/enrichment/parser.ts: CSV parsing and product-handle deduplication
- src/enrichment/enricher.ts: GPT-5.6 Terra enrichment using AGENTS.md section 9
- src/enrichment/provider.ts: EnrichmentProvider implementation
- src/enrichment/index.ts: parse, enrich, and return EnrichedIndex
- data/enriched-index.json: cached enriched index

## Constraints

- Use the enrichment prompt in AGENTS.md section 9 without semantic changes.
- Preserve the source data and add only defensible attributes with confidence scores.
- Enrich title-only products from title alone, with inferred confidence below 0.5.
- Never invent material percentages, care information, sizing, or unavailable catalog products.
- Cache the result in data/enriched-index.json. Do not call enrichment again when the cache is valid.
- The module must not import from src/agent/.
- Record request ID, prompt version, model, redacted payloads, latency, errors, and token usage.

## Acceptance Criteria

- Parser returns exactly 20 raw products from apparel.csv.
- Each product has structured attributes and confidence scores.
- data/enriched-index.json is saved and reused.
- Title-only enrichment uses low-confidence inferred attributes.
- Manual review of 3 to 5 products finds no unsupported material, sizing, or care claims.

## Test Plan

- Implement the parser count and enriched-field assertions in tests/test_enrichment_module.ts.
- Add a title-only fixture and assert inferred confidence is below 0.5.
- Inspect Ocean Blue Shirt and several other products for traceability.

## Out of Scope

Cart agent, tools, UI, and deployment.
