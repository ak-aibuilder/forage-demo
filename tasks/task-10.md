# Task 10: Substitution Badges and Gap Report Product Image

> **Model:** Terra | **Effort:** Medium

---

Read `AGENTS.md` and review `src/ui/components/cart-display.tsx` and `src/ui/components/gap-report.tsx`. Make two targeted UI improvements.

## Improvement 1: Substitution Badge on Cart Items

When the agent substitutes an out-of-stock item, the cart display should visually indicate which items are substitutions and what they replaced.

### Where to get the data

The decision_log entries contain the substitution chain. When the agent calls `find_substitutes` for an out-of-stock product, the log entry includes the original product ID/title. When the agent subsequently calls `add_to_cart` for the substitute, the justification text typically references the original item.

Parse the decision_log to detect substitution events:
1. Find `check_inventory` entries where the result shows `in_stock: false`
2. Find the subsequent `find_substitutes` entry for that product
3. Match the substitute to the `add_to_cart` entry that follows

Alternatively, scan each cart item's `justification` string for phrases like "substitute", "alternative", "out of stock", "unavailable", "replaces", or "instead of". If found, treat that item as a substitution.

### What to display

For each substituted item in the cart, add a small badge or label above or beside the item title:

- Badge text: "Substituted" in a distinct color (e.g., amber/orange background with dark text)
- Below the badge, a one-line note: "Original: [original product title] was out of stock"
- Extract the original product title from the decision_log or justification text

For non-substituted items, show no badge. The visual distinction should be immediately obvious when scanning the cart without expanding the agent trace.

### Styling

- Small rounded badge, similar in size and style to the constraint chips
- Amber/orange to signal "something changed here" without implying an error
- The note about the original item should be small, muted text below the badge
- Do not change the layout of existing cart item content (image, title, price, justification, slot)

## Improvement 2: Product Image in Gap Report

When the agent reports a catalog gap with a "closest available option," show that product's image alongside the gap report text.

### Where to get the data

The gap report currently includes text like "Closest available option: Blue Silk Tuxedo at $70.00" or similar. The product title and price are embedded in this text.

To display the image:
1. Load the catalog data (from `/api/catalog` or from the enriched index already loaded on the client)
2. Extract the product title mentioned in the gap report's closest-option text
3. Look up that product in the catalog by title (case-insensitive partial match)
4. Display its `imageSrc`

If the product can't be matched (title doesn't match anything in the catalog), skip the image and display the gap report as-is. Don't break the UI over a missing image match.

### What to display

In the gap report section, next to the "Closest available option" text:
- Product image thumbnail (approximately 60x60px or 80x80px)
- Product title
- Product price
- The existing gap report text (what's missing, catalog recommendation, minimum viable budget)

Layout: image on the left, gap report text on the right, similar to how cart items display their product images. The image makes the gap report concrete: "This is the closest thing we have, and here's why it doesn't meet your constraints."

### Styling

- Match the existing cart-display image styling (thumbnail size, border radius)
- The gap report section already has a distinct visual treatment (the "Catalog Gap" header with the red/coral accent). Keep that. Just add the image within the existing layout.
- If no image is found, show a subtle placeholder (gray box or no image) rather than breaking the layout.

## Constraints

- Do not modify any files in `src/agent/` or `src/enrichment/`
- Do not modify the agent's decision_log format or gap_report format
- Match existing styling conventions
- No em dashes in any text
- Both improvements should degrade gracefully: if substitution data can't be parsed, show no badge. If gap report product can't be matched, show no image.
- All three demo scenarios must still work after these changes

## Acceptance Criteria

- Stockout replan scenario: substituted cart items show an amber "Substituted" badge with the original product name
- Non-substituted items show no badge
- Catalog gap scenario: the gap report shows the closest available product's image next to the recommendation text
- Complete outfit scenario (no substitutions, no gaps): no badges, no gap report images (nothing changes)
- No regressions in any scenario

Save the modified files.
