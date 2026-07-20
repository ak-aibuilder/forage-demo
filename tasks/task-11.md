# Task 11: Production Optimization Roadmap

> **Model:** Terra | **Effort:** High

---

Read `AGENTS.md` and `README.md`. Review the Query Stats visible in the UI (~3,000-4,000 tokens, ~$0.30-0.50 per cart composition).

Create `docs/PRODUCTION_OPTIMIZATION_ROADMAP.md`.

## What this document is

A crisp, scannable technical document that shows the path from $0.50 to $0.05 per cart. Written for someone who will spend 2 minutes reading it, not 10. Every section earns its space. No filler, no preamble, no restating what the reader already knows.

## Structure

### Title
"From $0.50 to $0.05 Per Cart"

### Current Cost (3-5 sentences max)
Where the $0.50 goes. Three drivers: Sol used for all 15 steps including mechanical lookups, full catalog loaded into context on every tool call, and no caching. At 10K queries/day this is $150K/month.

### Four Optimizations

Each optimization gets ONE section with:
- What it does (1-2 sentences)
- Cost impact (specific percentage)
- Implementation effort (Low / Medium / High, with time estimate)
- One concrete example from Forage showing why it works

**1. Model Tiering** - Route mechanical steps (check_inventory, get_cart_summary, add_to_cart) to Luna. Keep Sol only for intent decomposition, substitution replanning, and gap analysis. 3-4 of 15 steps need Sol. Impact: 60-70% reduction. Effort: Low (1-2 days).

**2. Vector Search** - Replace loading all products into context with embedding-based retrieval of top-k matches. Input tokens per search drop from ~1,500 to ~300 regardless of catalog size. This is what unlocks scaling past 100 products. Impact: 30-40% reduction. Effort: Medium (1 week).

**3. Semantic Caching** - Cache results by goal similarity, not exact match. "Business casual for an interview, $150" and "interview outfit, professional, budget $150" hit the same cache. Top 200 query patterns cover ~65% of traffic. Impact: 50-60% blended. Effort: Medium (1 week).

**4. Context Window Management** - Sliding window of last 3-4 steps plus current cart state, instead of full 15-step history. Input tokens per step become constant (~800) instead of linearly growing. Impact: 20-30%. Effort: Medium-low (2-3 days).

### Combined Impact

One table. Current cost, optimized cost, reduction percentage. These compound multiplicatively. State the math in one sentence.

### Next Capability: Collaborative Negotiation

One paragraph only. The current agent makes autonomous tradeoff decisions when constraints conflict. The next evolution adds a human-in-the-loop negotiation step: when the agent detects a binding constraint (budget too tight, all formal items out of stock), it pauses execution, surfaces 2-3 concrete options with costs, and waits for user input before proceeding. This shifts the agent from autonomous executor to collaborative advisor. Frame this as the architectural direction, not a missing feature.

### Implementation Priority

A numbered list of 4 items. Sequence, time estimate, why that order. No prose wrapping the list.

## Constraints

- UNDER 2 PAGES. If it's longer, it's wrong.
- No paragraphs longer than 3 sentences
- Lead every section with the most important information
- Use tables for comparisons, not prose
- Specific numbers, not "significant reduction"
- No em dashes
- No competitor models or companies
- No prior employer names
- Practitioner voice: direct, concrete, zero filler

Save as `docs/PRODUCTION_OPTIMIZATION_ROADMAP.md`.
