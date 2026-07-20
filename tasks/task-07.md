# Task 7: Catalog Display with Raw vs Enriched Comparison

> **Model:** Terra | **Effort:** Medium

---

Read `AGENTS.md` and review the existing UI components in `src/ui/`. Then implement the following changes.

## Objective

Add a read-only product catalog display below the shopping goal input, and enhance the cart results to show raw vs enriched attribute comparison for each selected product. This lets users (and hackathon judges) see what the agent is working with and understand why enrichment matters.

## Changes

### 1. Catalog Browser Component

Create `src/ui/components/catalog-browser.tsx`

A read-only, scrollable grid or table showing all 20 products from apparel.csv in their RAW (unenriched) form. Display for each product:
- Product image (from imageSrc in enriched-index.json)
- Title
- Price
- Raw description (bodyHtml, stripped of HTML tags)
- Tags

This component loads data from a new API endpoint or from a static import. Keep it simple: load the enriched-index.json (it contains the raw fields too) and display ONLY the raw fields.

Add a heading above it: "Product Catalog" with a subtitle: "This is what the raw Shopify CSV looks like. No structured attributes, no agent-queryable data."

Style: clean card grid, 2-3 columns, compact. Read-only, no interactions. Should not dominate the page; the shopping goal and results are still primary.

Place this component below the GoalInput component and above the results section in `src/ui/page.tsx`.

### 2. Enhanced Cart Item Display

Modify `src/ui/components/cart-display.tsx`

For each item in the cart results, show a comparison panel:

**Left side: "Raw catalog"**
- Title
- Raw description (bodyHtml stripped of tags)
- Tags
- Price

**Right side: "Enriched attributes"**
- use_case_tags (or useCaseTags)
- aesthetic_style (or aestheticStyle)
- functional_attributes (or functionalAttributes)
- material_composition (or materialComposition)
- confidence_scores for each attribute
- substitute_candidates

**Visual treatment:** Use a subtle two-column layout within each cart item card. Left side slightly muted (representing the sparse raw data), right side with a highlight or accent (representing the enrichment the agent used). Include a small label or badge: "What the CSV had" on the left, "What the agent used" on the right.

### 3. API Enhancement

Modify the cart API response or the client-side data flow so that the full enriched product data (including raw fields) is available for each cart item. Currently cart items may only include product_id, title, price, justification, and slot. The enriched-index.json data needs to be accessible on the client side for the comparison display.

Options (pick the simplest):
- Include the full enriched product object in each cart item in the API response
- Load enriched-index.json on the client side and look up by product handle/id
- Create a lightweight `/api/catalog` endpoint that returns the enriched index

### 4. Data Loading

Create `/app/api/catalog/route.ts` (if needed)

A simple GET endpoint that reads `data/enriched-index.json` and returns it. The catalog browser and cart comparison components can fetch from this endpoint on page load.

## Constraints

- The catalog browser is READ-ONLY. No filtering, no search, no interactions.
- Do not modify the agent logic, tools, enrichment module, or any file in `src/agent/` or `src/enrichment/`.
- The catalog display should not slow down page load. Load it asynchronously.
- Keep the existing UI layout hierarchy: goal input at top, then catalog, then results.
- Mobile responsiveness is out of scope but it should look reasonable on a laptop.
- No em dashes in any text content.
- Match the existing styling conventions in globals.css.

## Acceptance Criteria

- All 20 products visible in the catalog browser with images, titles, prices, and raw descriptions.
- Each cart item in the results shows raw vs enriched side-by-side comparison.
- Confidence scores visible for enriched attributes.
- The catalog loads without blocking the goal input or cart composition.
- All three demo scenarios still work correctly.
- No regressions in existing functionality.

## Out of Scope

- A second "raw" agent that runs against unenriched data
- Catalog filtering or search
- Editable catalog
- Mobile optimization
