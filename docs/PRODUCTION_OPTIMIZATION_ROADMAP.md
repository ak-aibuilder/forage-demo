# From $0.50 to $0.05 Per Cart

## Current Cost

Query Stats accumulates usage across every model response in one cart run. A verified complete-outfit run recorded 50,482 total tokens, 12 tool calls, 13 logged steps, and an estimated $0.547 cost using the UI's $10 per million input-token and $30 per million output-token assumptions. The app does not persist traces, so this is an observed run rather than a traffic-wide average. At 10,000 queries per day, a $0.547 cart costs about $164,100 per month.

The cost comes from using Sol for every model turn, sending the full conversation and prior tool outputs on each subsequent turn, and having no semantic cache. The product index is not injected wholesale into every model call, but search results can return enriched product records and remain in the growing conversation history.

## Four Optimizations

The percentage reductions, token targets, and cache coverage below are planning estimates to validate with persisted production traces.

### 1. Model Tiering

Route deterministic tool work to Luna and reserve Sol for intent decomposition, substitution replanning, and gap analysis. The target is 3 to 4 Sol-level decisions in a typical 12 to 15 step cart run.

| Cost impact | Implementation effort | Forage example |
| --- | --- | --- |
| 60 to 70% reduction | Low, 1 to 2 days | `check_inventory`, `get_cart_summary`, and `add_to_cart` validate state without interpreting the shopping goal. |

### 2. Vector Search

Replace broad catalog-result payloads with embedding retrieval for the top matching products. Search input can fall from about 1,500 tokens to about 300 tokens regardless of catalog size, enabling catalogs beyond 100 products.

| Cost impact | Implementation effort | Forage example |
| --- | --- | --- |
| 30 to 40% reduction | Medium, 1 week | An interview-outfit goal retrieves polished shirts, jackets, and bags before Sol decides the compatible cart. |

### 3. Semantic Caching

Cache outcomes by goal similarity instead of exact text. The planning target is for the top 200 query patterns to cover about 65% of traffic.

| Cost impact | Implementation effort | Forage example |
| --- | --- | --- |
| 50 to 60% blended reduction | Medium, 1 week | "Business casual for an interview, $150" and "interview outfit, professional, budget $150" reuse the same resolved cart plan. |

### 4. Context Window Management

Send the current cart state and only the last 3 to 4 steps, rather than the full prior transcript. The target is stable per-step input of roughly 800 tokens instead of growth with every decision.

| Cost impact | Implementation effort | Forage example |
| --- | --- | --- |
| 20 to 30% reduction | Medium-low, 2 to 3 days | After a jacket stockout, the agent needs the replacement decision and current budget, not the earlier shirt-search payload. |

## Combined Impact

| Metric | Current | Optimized target | Reduction |
| --- | ---: | ---: | ---: |
| Cost per cart | $0.547 observed run | $0.05 target | 91% |

Using midpoint reductions, the sequence is $0.547 x 0.35 x 0.65 x 0.45 x 0.75 = $0.042, so $0.05 is a conservative operating target.

## Next Capability: Collaborative Negotiation

The current agent makes autonomous tradeoffs when constraints conflict. The next architectural step pauses on a binding constraint, such as an insufficient budget or no formal items in stock, presents 2 to 3 concrete options with costs, and waits for input before proceeding. This evolves Forage from autonomous executor to collaborative advisor.

## Implementation Priority

1. **Model tiering, 1 to 2 days:** Targets Sol removal from the mechanical decisions in a 12 to 15 step cart run with the fastest cost reduction.
2. **Context window management, 2 to 3 days:** Makes per-step token use stable before optimizing retrieval.
3. **Vector search, 1 week:** Cuts search context and unlocks catalogs beyond 100 products.
4. **Semantic caching, 1 week:** Captures repeated demand after stable cart plans and retrieval behavior are in place.
