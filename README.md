# Forage

An agentic cart composition engine that turns natural-language shopping goals into multi-item carts with constraint reasoning, substitution replanning, and catalog gap reporting.

## The Problem

Shopping agents need to assemble complete solutions, not return a ranked list of products. A request for an interview outfit under a shared budget requires the system to infer occasion and style constraints, select compatible items, respect availability, and make tradeoffs across the full cart.

Most product catalogs are unstructured prose with no agent-queryable attributes. That leaves merchants unable to test whether an agent can reliably satisfy a real shopping goal against their data before customers encounter incomplete carts, budget overruns, or invented matches.

This matters now because agentic commerce is accelerating while catalog readiness lags behind. Forage applies practical retail experience to expose the gap: raw catalog data cannot support dependable multi-step reasoning, while enriched, traceable data can.

## What Makes Forage Different

- **Intent decomposition:** The agent translates a shopping goal into stated constraints and defensible implicit constraints such as professional, polished, and non-formal.
- **Cross-item budget adherence:** It treats the budget as a hard limit across every cart slot, not as a per-item preference.
- **Substitution and replanning:** When an item is unavailable, it finds a compatible alternative and reevaluates price and cart dependencies.
- **Gap reporting:** When the catalog cannot satisfy a goal, it identifies what is missing, the closest option, and the catalog addition that would resolve it.

Forage is not a chatbot wrapper around product search. It reasons through a collection, replans when conditions change, and reports catalog limitations.

## How It Works

### Enrichment Module (GPT-5.6 Terra)

The enrichment module takes the raw Shopify apparel.csv catalog and adds structured material, use-case, style, seasonal, functional, substitute, and confidence attributes. It is behind the EnrichmentProvider interface, keeping the enrichment implementation modular and swappable for a future external service.

### Cart Agent (GPT-5.6 Sol)

The cart agent uses five controlled tools to search the enriched index, check simulated inventory, find substitutes, add an item, and inspect cart state. It decomposes goals, enforces a shared budget, replans substitutions, reports gaps, and logs every decision.

1. Load CSV
2. Enrich products into an EnrichedIndex
3. Submit a shopping goal
4. Compose a constraint-aware cart
5. View the cart, decision log, and any gap report

## Demo Video

[Placeholder: YouTube link]

## How to Run

~~~bash
# Clone
git clone <repository-url>
cd forage

# Install
npm install

# Set API key
export OPENAI_API_KEY=your_key_here

# Enrich sample data
npm run enrich

# Start
npm run dev

# Or run from CLI
npm run agent "business casual outfit for a job interview, budget $150"
~~~

These commands are the intended TypeScript stack. Update them only if the implementation deliberately adopts an equivalent command.

## Sample Queries to Try

1. "I need a business casual outfit for a job interview, budget $150"
2. "Weekend casual look, keep it under $80"
3. "Formal evening outfit under $60" (triggers gap reporting)

## How Codex Was Used

**Placeholder: complete during or after the build.**

- Codex generated the initial project scaffolding including [X].
- Codex accelerated [Y] by [how].
- Key decisions where Codex contributed: [Z].
- Codex Session IDs: [list].

## How GPT-5.6 Powers the App

### Enrichment (Terra)

Terra performs batch attribute generation, turning sparse product descriptions into structured, agent-queryable attributes with confidence scores. It is suited to cost-conscious batch processing.

### Cart Agent (Sol)

Sol performs multi-step reasoning with function calling. The cart agent needs to satisfy constraints across several tools, replan after substitutions, and explain catalog gaps.

## Architecture

The module boundary is:

~~~text
EnrichmentProvider.enrich(raw_products: CSV) -> EnrichedIndex
~~~

The cart agent consumes only EnrichedIndex, never raw CSV data. This makes enrichment replaceable without changing agent behavior and preserves a clean route to future catalog-enrichment integrations.

## What Works and What Doesn't

### Works well

- **Placeholder: complete after build and validation.**
- [Intent decomposition result]
- [Substitution and replanning result]
- [Gap-reporting result]

### Known Limitations

- Single-category apparel demo. The architecture supports additional categories.
- Simulated inventory, not real-time inventory.
- A 20-product catalog. A production catalog needs scalable retrieval.
- Enrichment runs once, not incrementally.
- No interactive constraint-negotiation or tradeoff options.

## Future Extensions

- Multi-category catalog support
- Pluggable external enrichment-provider integration
- User-facing constraint negotiation and tradeoff options
- Real-time inventory integration
- Scalable vector retrieval for larger catalogs

## Related Work

**Placeholder: document the post-hackathon catalog-readiness integration here without naming prior-employment products or companies.** The integration will consume enriched catalog output through EnrichmentProvider.

## Built For

OpenAI Build Week 2026, Work & Productivity
