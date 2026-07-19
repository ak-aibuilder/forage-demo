# Forage Product Requirements Document

## 1. Problem Statement

Shopping agents need to compose complete, multi-item solutions while balancing occasion, style, availability, and a shared budget. Most apparel catalogs expose only prose descriptions, not structured attributes an agent can query and reason over. Merchants therefore cannot see how an agent will behave against their data until customers encounter incomplete carts, budget overruns, or unhelpful failures.

## 2. User + Problem

A catalog operations lead at an apparel merchant needs to test whether an agent can build complete, constraint-aware carts from the Shopify apparel.csv catalog because the catalog's unstructured product data hides agent failures until customers experience them.

## 3. Delightful Use Case

I ask for a business-casual job-interview outfit under $150 and get a complete, compatible cart, not a list of shirts. I did not have to spell out that I wanted polished rather than formal, neutral rather than loud, or that the pieces had to work together. When a selected item was unavailable, the agent found an alternative, recalculated the total, and adjusted the rest of the cart before showing me the result and a short decision log.

## 4. Predicted Failure Modes

1. The agent will stop after adding only two required apparel items and claim the cart is complete.
2. When a substitute costs more than the unavailable item, the agent will not recalculate the full cart total before returning it.
3. The agent will choose the strongest match for each slot independently and exceed the shared budget.
4. When `search_catalog` returns no result, the agent will neither retry with safely relaxed constraints nor provide a concrete catalog gap report.

## 5. Four Evals

### 1. Intent decomposition

**Input:** "Build a business-casual job-interview outfit from Shopify apparel.csv for $150."

**Expected output:** The agent infers polished, professional, non-formal styling and selects compatible apparel within budget, with a decision log that states the inferred constraints.

**Scoring (0-5 scale):** 5 = infers all relevant implicit constraints and applies them consistently; 4 = one minor inference or explanation gap; 3 = recognizes business-casual intent but misses a notable implicit constraint; 2 = mostly literal matching with weak occasion reasoning; 1 = attempts unrelated or contradictory interpretation; 0 = no usable result.

**Threshold:** 4

### 2. Cart completeness

**Input:** "I need a complete interview outfit under $150: a top, an outer layer, and a bag."

**Expected output:** The cart contains all three requested slots from Shopify apparel.csv and clearly identifies each role.

**Scoring (0-5 scale):** 5 = all three slots are present, compatible, and correctly labeled; 4 = complete cart with a minor labeling or compatibility issue; 3 = all slots present but one is a weak fit; 2 = only two slots completed or one requested role is unclear; 1 = attempted cart does not satisfy the request; 0 = no cart.

**Threshold:** 4

### 3. Substitution and replanning

**Input:** "Build the interview outfit under $150, but mark White Cotton Shirt and Black Leather Bag out of stock."

**Expected output:** The agent checks inventory, substitutes available compatible items, rechecks the full total after each substitution, and explains any remaining catalog gap.

**Scoring (0-5 scale):** 5 = detects both stockouts, finds suitable replacements, replans dependencies, and keeps the final total compliant; 4 = correct replacements and total with a minor rationale gap; 3 = handles stockouts but replan or explanation is incomplete; 2 = replaces only one item or does not verify the updated total; 1 = returns unavailable items or abandons without a useful gap; 0 = no usable response.

**Threshold:** 4

### 4. Budget adherence

**Input:** "Assemble a polished three-item outfit from Shopify apparel.csv for no more than $130."

**Expected output:** The agent uses `add_to_cart` and `get_cart_summary`, returns three compatible items, and reports a running total at or below $130.

**Scoring (0-5 scale):** 5 = complete cart, exact total, and total is at or below budget; 4 = compliant cart with a minor arithmetic or presentation issue that does not change the result; 3 = budget-compliant but one selection is a weak fit or total evidence is incomplete; 2 = incomplete cart or ambiguous budget verification; 1 = attempts the task but exceeds budget; 0 = no cart or no budget handling.

**Threshold:** 4

## 6. Out of Scope

- Real payment processing
- Real inventory systems
- Multi-user sessions
- Production-scale catalogs over 1,000 products
- Mobile-optimized UI
- Multi-category support in this submission (supported architecturally, not demonstrated)
- External enrichment API integration
- Constraint negotiation with user-facing tradeoff options

## 7. Success Criteria for Hackathon

**Working product:** A user can enter each demo goal, the agent uses the enriched index and the five tools, returns a complete cart or actionable gap report, simulates inventory, replans substitutions, enforces the shared budget, and shows a concise decision log.

**Demo video:** In under three minutes, show intent decomposition, a complete cart, an out-of-stock substitution with a recalculated total, and the impossible formal-under-$60 gap report.

**README:** Complete product overview, architecture and module boundary, local setup, environment configuration, demo scenarios, eval definitions and scores, limitations, and a link to the demo video.
