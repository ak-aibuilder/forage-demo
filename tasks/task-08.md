# Task 08: UI Enhancements and Side-by-Side Comparison

> **Model:** Sol | **Effort:** High
> This task combines six features into one build. Sol at High is justified because the side-by-side comparison requires careful architectural decisions and the visual trace needs component design thinking.

---

Read `AGENTS.md`, `PRD.md`, and review all existing UI components in `src/ui/`. Then implement the following six enhancements. Do not modify any files in `src/agent/` or `src/enrichment/`. All changes are UI-layer and, where needed, new lightweight utility functions in `src/shared/` or new API endpoints.

## Enhancement 1: Two-Panel Side-by-Side Comparison

This is the most important feature in this task. It visually proves the core thesis: raw catalog data fails where enriched data succeeds.

### Raw Search Utility

Create `src/shared/raw-search.ts`

A simple function that takes a shopping goal (string) and the raw product data (titles, bodyHtml, tags, prices) and returns its best-guess product matches using only naive text processing. No GPT-5.6 calls. No tool-use loop. No ReAct.

Implementation:
- Tokenize the shopping goal into keywords (split on spaces, remove stop words like "a", "for", "the", "my", "under", "budget", "need", "outfit")
- For each product, score it by counting how many goal keywords appear in the product's title + bodyHtml + tags (case-insensitive)
- Return the top 3-5 matches, sorted by score descending
- Each result includes: title, price, bodyHtml, match_score, matched_keywords
- No budget tracking, no constraint awareness, no substitution, no justification, no slot assignment
- If no keywords match any product, return an empty array

This function must be fast (no API calls) and deterministic.

### Raw Search API Endpoint

Create `/app/api/raw-search/route.ts`

A POST endpoint that accepts `{ goal: string }`, loads the enriched-index.json (using only raw fields: title, bodyHtml, tags, price), runs the raw search utility, and returns the results.

### Side-by-Side UI

Modify `src/ui/page.tsx` and create `src/ui/components/raw-results.tsx`

When the user clicks "Compose cart," run BOTH:
- The raw search (via `/api/raw-search`, fast, returns immediately)
- The enriched agent (via `/api/cart`, takes 10-30 seconds)

Display results in two panels side by side:

**Left panel: "Without Enrichment"**
- Header: "Naive keyword search"
- Shows the raw search results: product titles, prices, matched keywords highlighted
- No budget tracking, no justification, no constraint analysis
- If no matches: "No products matched the goal keywords."
- A subtle label: "No constraint awareness. No substitution. No budget tracking."
- Muted/faded styling to signal this is the "before" state

**Right panel: "With Enrichment"**
- Header: "Agentic composition (GPT-5.6 Sol)"
- Shows the full agent results: cart items with justification, budget tracking, constraint compliance, decision log, gap report
- This is the existing cart display, moved into the right panel
- Accent/highlighted styling to signal this is the "after" state

The left panel should populate immediately (raw search is instant). The right panel shows a loading state while the agent runs. This creates a dramatic reveal: the naive results appear fast but are obviously wrong, then the enriched agent results appear and are clearly superior.

On mobile or narrow screens, stack the panels vertically (left on top, right below). But don't spend significant time on mobile responsiveness.

### Visual Treatment

The two panels should have:
- Equal width, separated by a subtle vertical divider or gap
- Different background tints: left panel slightly grayed/muted, right panel slightly highlighted
- A comparison header spanning both panels: "Same goal, same products, different data"
- The raw panel should feel intentionally sparse and unsatisfying
- The enriched panel should feel complete and trustworthy

## Enhancement 2: Product Images in Cart Results

Modify `src/ui/components/cart-display.tsx`

For each item in the cart results (right panel), display the product image thumbnail next to the item details. Use the `imageSrc` field from the enriched product data.

- Image size: approximately 80x80px or similar thumbnail
- Place the image to the left of the item title, price, and justification
- If imageSrc is missing or empty, show a simple placeholder (gray box with a generic icon or the product's first letter)
- Also show product images in the raw results panel (left side) for visual parity

Load the enriched-index.json product data on the client to look up imageSrc by product handle/id. Reuse the `/api/catalog` endpoint if it exists from Task 7, or create it.

## Enhancement 3: Token Usage and Cost Display

Modify `src/ui/components/cart-display.tsx` or create `src/ui/components/query-stats.tsx`

Display a "Query Stats" footer below the cart results (right panel only) showing:
- Total tokens used (input + output)
- Number of tool calls made
- Number of agent reasoning steps
- Estimated API cost

Calculate estimated cost using approximate GPT-5.6 Sol pricing. If exact pricing is unknown, use reasonable placeholders (e.g., $10/1M input tokens, $30/1M output tokens) and note "estimated" in the display.

Extract token data from the agent response. The agent already returns usage information. If it does not, add a `usage` or `stats` field to the cart API response that includes: `{ input_tokens, output_tokens, total_tokens, tool_calls_count, reasoning_steps }`.

Style: small, muted text. Not the focus, but visible for judges who look for it. Something like:
"13 tool calls, 4,230 tokens, ~$0.08 estimated cost"

## Enhancement 4: Constraint Chips

Create `src/ui/components/constraint-chips.tsx`

After the agent decomposes the shopping goal, display the extracted constraints as visual chips/tags above the cart items in the right panel.

- Parse constraints from the decision_log. The first entry or entries should contain the agent's intent decomposition listing explicit and implicit constraints.
- Display explicit constraints (stated by the user) in one color (e.g., blue chips): "budget: $150", "occasion: job interview", "style: business casual"
- Display inferred constraints (deduced by the agent) in another color (e.g., amber/gold chips): "professional", "polished", "neutral colors", "non-formal"
- Place this section between the comparison header and the cart items, labeled "Constraints identified"
- Each chip is a small rounded badge with the constraint text

Parsing approach: look for the decision_log entry where the agent records its decomposition. The agent system prompt instructs it to record explicit and implicit constraints. Extract these from the reasoning text. If the format varies, do a best-effort parse: look for keywords like "explicit", "implicit", "inferred", "stated" in the log entries, or simply display the first reasoning entry's content as chips.

If parsing proves unreliable, fall back to displaying the full first reasoning entry as a styled quote block rather than individual chips.

## Enhancement 5: Visual Agent Trace

Modify `src/ui/components/decision-log.tsx`

Replace or enhance the existing expandable text decision log with a visual step-by-step timeline.

Each step is a card showing:
- Step number
- Tool called (or "Reasoning" for agent thinking steps)
- Key inputs (condensed, not full JSON)
- Key outputs (condensed)
- Agent's reasoning for this step (one sentence)

Color-code by step type:
- Blue: `search_catalog` calls
- Orange: `check_inventory` calls
- Red: out-of-stock results
- Green: `add_to_cart` calls
- Purple: `find_substitutes` calls
- Yellow: gap report entries
- Gray: `get_cart_summary` calls

Connect the steps with a vertical timeline line (left-side border or a thin line connecting the cards).

Make the trace collapsible (collapsed by default showing just "X steps, expand to see trace") so it doesn't overwhelm the page. When expanded, the visual flow tells the story of how the agent composed the cart.

Keep the raw JSON data accessible via a "Show raw JSON" toggle within the trace for judges who want to inspect the actual tool call payloads.

## Enhancement 6: Export Cart as Checkout Payload

Create `src/ui/components/export-button.tsx`

Add a "Copy checkout payload" button at the bottom of the cart results (right panel).

When clicked, copy a structured JSON payload to the clipboard containing:
- items: array of { product_id, title, quantity: 1, unit_price, slot }
- subtotal
- budget_limit
- budget_remaining
- constraints_met: the constraint compliance checklist
- source: "forage-demo"
- timestamp: ISO 8601

After copying, show a brief "Copied!" confirmation tooltip or text change on the button.

Frame the button with a small note: "Structured for agentic checkout integration"

This is a narrative bridge to downstream checkout protocols. Keep it simple.

## Layout Changes to `src/ui/page.tsx`

Update the page layout to accommodate the new components. The flow should be:

1. Header (existing)
2. Goal input with scenario buttons (existing)
3. Product catalog browser (from Task 7)
4. Comparison header: "Same goal, same products, different data"
5. Two-panel results:
   - Left: Raw search results (loads instantly)
   - Right: Enriched agent results (loads after agent completes), containing:
     a. Constraint chips (top)
     b. Cart items with images and raw-vs-enriched comparison
     c. Gap report (if any)
     d. Visual agent trace (collapsible)
     e. Query stats footer
     f. Export checkout payload button
6. Footer or attribution

## Constraints

- Do NOT modify any files in `src/agent/` or `src/enrichment/`
- Do NOT modify the agent's system prompt, tool schemas, or ReAct loop
- The raw search function must NOT call GPT-5.6 or any external API. It is purely local text matching.
- Match existing styling conventions in `globals.css` and `app/globals.css`
- No em dashes in any text or UI labels
- All product images loaded from the existing `imageSrc` URLs (Shopify Burst CDN)
- The page must still work if the agent API call fails (show error in right panel, raw results in left panel)
- All three demo scenarios must still work correctly after these changes
- Loading states must be visible while the agent processes

## Acceptance Criteria

- Side-by-side comparison renders with raw results on left, enriched agent results on right
- Raw search returns instantly, enriched agent shows loading state then results
- Product images appear in both panels for matched products
- Constraint chips display above cart items with explicit/inferred distinction
- Token usage and cost footer visible below cart results
- Visual agent trace shows color-coded step cards in a timeline layout
- Trace is collapsible (collapsed by default)
- Export button copies valid JSON to clipboard with confirmation
- All three demo scenarios produce correct output through the updated UI
- No regressions in existing agent or enrichment functionality

## Out of Scope

- Second GPT-5.6 agent call for the raw side (raw search is local only)
- Mobile optimization beyond basic readability
- Animations or transitions
- Dark/light mode toggle
- Product detail modals
