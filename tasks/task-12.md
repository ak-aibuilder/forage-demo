# Task 12: Guardrails, Checkbox Removal, and Hero Queries

> **Model:** Terra | **Effort:** Medium

---

Read `AGENTS.md` and review `src/ui/page.tsx`, `src/ui/components/goal-input.tsx`, and `app/api/cart/route.ts`. Make three changes.

## Change 1: Off-Topic Query Guardrails

Add a pre-check before running the agent that validates whether the shopping goal is commerce-related. This prevents the agent from wasting tokens on nonsense queries and prevents embarrassing results when a user types something like "what's the weather" or "tell me about cricket."

### Implementation

Add a lightweight classification step at the START of the `/app/api/cart/route.ts` handler, BEFORE the agent runs. Two approaches (pick the simpler one):

**Option A (no API call, preferred):** A keyword/heuristic check. If the goal contains none of the following signals, reject it:
- Shopping-related words: buy, outfit, wear, clothes, shirt, jacket, pants, shoes, jewelry, gift, accessory, dress, formal, casual, budget, under, style, look, wardrobe, shopping, find, need, get, match, set
- Price indicators: $, dollar, under, budget, max, spend
- Occasion words: interview, wedding, party, date, work, weekend, dinner, trip, meeting

If no shopping signal is detected, return early with:
```json
{
  "error": "off_topic",
  "message": "Forage composes shopping carts from product catalogs. Try a goal like 'business casual outfit for a job interview, budget $150'.",
  "suggestions": [
    "business casual outfit for a job interview, budget $150",
    "weekend casual look, keep it under $80",
    "formal evening outfit under $60"
  ]
}
```

**Option B (if Option A feels too brittle):** A single fast GPT-5.6 Luna call with a short prompt: "Is this a shopping or product search request? Reply YES or NO only: [goal]". If NO, return the same error response. This costs minimal tokens but adds ~1 second latency.

### UI Handling

In the UI, detect the `off_topic` error type and display the message with clickable suggestion links that populate the goal input. Style it as a friendly nudge, not an error. Use the same card styling as the gap report but with a neutral color.

### Test Cases

These should be rejected:
- "what's the weather today"
- "tell me a joke"
- "cricket match updates"
- "who is the president"
- "" (empty string)

These should be accepted:
- "business casual outfit for a job interview, budget $150"
- "I need a jacket"
- "gift for my girlfriend"
- "something warm for winter under $100"
- "black pants"

## Change 2: Remove "All Products in Stock" Checkbox

Remove the "All products in stock" checkbox from the UI. The three scenario buttons should control inventory state behind the scenes:

- **Complete outfit** button: sends `allInStock: true` (all products available)
- **Stockout replan** button: sends `allInStock: false` (uses inventory-config.json with 3 out-of-stock items)
- **Catalog gap** button: sends `allInStock: true` (the gap comes from the query not matching available products, not from stock issues)

When the user types a custom query (not using a button), default to `allInStock: true`.

Remove the checkbox component and its state management from the UI. The `allInStock` parameter should still be sent to the API but is now controlled by the button clicked, not by a visible checkbox.

## Change 3: Add More Example Queries

Add 2-3 additional clickable example queries below the goal input or alongside the existing three scenario buttons. These give users more scenarios to try and show the product's range:

Suggested additional queries (pick 2-3):
- "weekend casual look, keep it under $80"
- "rainy day outfit with a waterproof jacket, budget $120"
- "minimalist gift set for a friend, under $100"

Each query is a clickable chip/button that populates the goal input when clicked, similar to the existing scenario buttons. Style them as secondary/smaller buttons to distinguish from the three primary scenario buttons.

The primary buttons (Complete outfit, Stockout replan, Catalog gap) remain as they are. The new queries are additional examples, not replacements.

## Constraints

- Do NOT modify any files in `src/agent/` or `src/enrichment/`
- The guardrail check must run BEFORE the agent, not inside the agent
- The guardrail must not block legitimate shopping queries that happen to be phrased unusually
- Keep the checkbox removal clean: no leftover state variables or unused imports
- No em dashes in any text
- Match existing styling conventions

## Acceptance Criteria

- Off-topic queries ("what's the weather", "tell me a joke", empty string) return a friendly message with suggestions
- All three demo scenarios still work correctly
- Shopping queries phrased unusually ("I need something nice to wear") are NOT blocked
- Checkbox is completely removed from the UI
- Scenario buttons control inventory state behind the scenes
- Custom queries default to all products in stock
- 2-3 additional example queries are visible and clickable
- No regressions in existing functionality

Save all modified files.
