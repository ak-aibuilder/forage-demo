# Forage: Shared Project Context

> **How to use:** Commit this file to the root of your Forage repo FIRST. Every subsequent Codex prompt references this file for shared context. This avoids repeating the full product definition in every prompt.

## Product Name

**Forage** - an agentic cart composition engine for commerce.

## Elevator Pitch

Forage turns natural-language shopping goals into multi-item carts by reasoning across constraints, handling out-of-stock, and negotiating budget tradeoffs - not searching, composing.

## Core Thesis

Most merchant product catalogs fail when a real shopping agent tries to use them. Descriptions are unstructured prose with no machine-readable attributes. Forage demonstrates the problem and the solution in a single product: raw catalog data can't support agent reasoning, but enriched data can.

## What Makes Forage Agentic

Forage is not product search. Search takes a query and returns ranked results. Forage takes a shopping *goal* and assembles a coherent *collection* through autonomous multi-step reasoning. Four core agentic capabilities:

1. **Intent decomposition with implicit constraint inference.** "Business casual for a job interview" is not a search query. The agent decomposes it: professional but not formal, polished but approachable, likely neutral colors. None of these constraints are stated. The agent infers them from the occasion and translates them into queryable attributes.

2. **Cross-item budget and constraint adherence.** A $150 budget applies across the entire cart, not per item. The agent allocates budget across slots, tracks the running total after each addition, and rebalances when a selection in one slot changes what's affordable in another.

3. **Substitution with replanning.** Item A is out of stock. Substitute A' is a different price or style. Now the budget allocation shifts and item B (selected to complement A) may no longer work. The agent detects this dependency, re-evaluates the cart, and cascades changes through. Each substitution can trigger a new reasoning cycle.

4. **Gap reporting.** When the agent fails to complete a cart, it reports exactly what's missing: "Your catalog has no formal items under $60. The closest match is $85. Adding 2-3 options in the $40-70 range would resolve this." These gap reports are actionable feedback for upstream catalog enrichment.

## Architecture

Two modules with a clean interface boundary.

**Module 1: Enrichment Module (modular, swappable)**
- Takes raw Shopify CSV, uses GPT-5.6 Terra to enrich each product with structured attributes
- Sits behind an `EnrichmentProvider` interface so it can be swapped for an external API post-hackathon
- Enriches with: material/composition, use-case tags, aesthetic style, seasonal relevance, functional attributes, substitute candidates, confidence scores per attribute
- Outputs an EnrichedIndex

**Module 2: Cart Agent (core product)**
- ReAct-style tool-use agent powered by GPT-5.6 Sol
- Decomposes shopping goals into constraints
- Queries enriched index via 5 tools
- Handles substitution, replanning, budget enforcement, gap reporting
- Produces cart output with decision log

**Module Boundary:**
```
EnrichmentProvider.enrich(raw_products: CSV) -> EnrichedIndex
```
Agent consumes EnrichedIndex only. Never touches raw data. Separate directories: `src/enrichment/` and `src/agent/`. No cross-imports.

## Agent Tools (5)

- `search_catalog` - query enriched index with structured filters (use-case, style, price range, functional attributes)
- `check_inventory` - check simulated stock status for a product
- `find_substitutes` - find alternatives for an out-of-stock item matching specified constraints
- `add_to_cart` - add a product with justification, returns updated running total
- `get_cart_summary` - current cart contents, running total, constraint compliance status

## Data Source

Shopify apparel.csv (20 products) from https://github.com/shopifypartners/product-csvs

Typical product:
```
Title: Ocean Blue Shirt
Body: Ocean blue cotton shirt with a narrow collar and buttons down the front and long sleeves. Comfortable fit and tiled kalidoscope patterns.
Type: (empty)
Tags: men
Price: $50
```

No structured attributes. This is the problem Forage solves.

## Tech Stack

- Build tool: Codex App
- Runtime: GPT-5.6 via OpenAI API (Terra for enrichment, Sol for agent)
- Frontend: Next.js 14+ or React
- Data store: In-memory JSON index
- Hosting: Railway
- Data: Shopify apparel.csv (20 products)

## Demo Scenarios

1. **Intent decomposition + budget:** "I need a business casual outfit for a job interview, budget $150"
2. **Substitution + replanning:** Same as #1, but with 2 products out of stock
3. **Gap reporting:** "Formal evening outfit under $60" (impossible with this catalog)

## Hackathon Details

- OpenAI Build Week 2026
- Category: Work & Productivity
- Deadline: Monday July 21, 2026, 5:00 PM PT
- Judging: Technological Implementation, Design, Potential Impact, Quality of the Idea (equally weighted)
- Requirements: working project with Codex + GPT-5.6, demo video (<3 min), public repo with README

## Hard Constraints (Apply to ALL Artifacts)

- No em dashes anywhere. Use hyphens, commas, colons, or parentheses
- Do not reference Claude, Anthropic, Google, Groq, Llama, Qwen, DeepSeek, or any non-OpenAI model/company
- Do not reference named competitor frameworks
- Do not reference company names or brand names from my prior employment
- All examples use Shopify apparel.csv data
- Direct, practitioner voice (not academic, not marketing)
