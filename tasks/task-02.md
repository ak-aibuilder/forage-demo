# Enriched Index Query Interface and Tools

## Codex Model + Effort

GPT-5.6 Terra, medium effort

## Objective

Build in-memory enriched-index search, cart state, simulated inventory, and all five agent tool handlers.

## Background

Task 1 is complete and data/enriched-index.json contains 20 enriched products. Read AGENTS.md section 7 before implementing tool schemas. The agent module may consume the index but must not import the enrichment module.

## Files

Create:

- src/agent/tools/search-catalog.ts
- src/agent/tools/check-inventory.ts
- src/agent/tools/find-substitutes.ts
- src/agent/tools/add-to-cart.ts
- src/agent/tools/get-cart-summary.ts
- src/agent/tools/index.ts
- src/agent/cart-state.ts
- data/inventory-config.json

## Constraints

- Match the strict OpenAI function-tool schemas in AGENTS.md section 7.
- search_catalog supports use case, aesthetic style, price range, functional attributes, and keyword filters.
- check_inventory reads configurable simulated stock from data/inventory-config.json.
- Configure 3 to 4 stockouts, including the products used by the substitution scenarios.
- add_to_cart returns running total and budget remaining.
- find_substitutes ranks available alternatives by compatible category, use case, style, and price.
- Tools read the enriched-index file or receive EnrichedIndex, never import src/enrichment/.
- Automatically log normalized tool input, output, status, latency, and failure.

## Acceptance Criteria

- A job-interview filter returns relevant enriched products.
- Configured stockouts return correctly from check_inventory.
- find_substitutes returns ranked alternatives.
- Multiple additions produce correct running totals and budget remaining.
- get_cart_summary conforms to CartOutput without decision_log.

## Test Plan

- Add unit coverage for each tool.
- Exercise search, inventory check, substitution, addition, and summary as one integration flow.
- Run the cart-completeness and budget test stubs as their assertions are implemented.

## Out of Scope

ReAct loop, UI, and deployment.
