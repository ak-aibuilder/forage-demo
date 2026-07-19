# Forage Operating Manual

## 1. Project Overview

Forage composes complete apparel carts from a natural-language shopping goal, shared budget, and simulated inventory. It is not product search: the cart agent infers unstated constraints, selects compatible items, replans after stockouts, and reports catalog gaps. The enrichment module converts raw CSV records into an EnrichedIndex; the cart agent uses only that index and five controlled tools. The core thesis is that agent performance depends on structured, traceable catalog data, and Forage makes this visible before customers encounter failures.

## 2. Architecture

~~~text
data/apparel.csv
      |
      v
Enrichment Module (GPT-5.6 Terra, batch)
      |
      v
EnrichedIndex  <--- interface boundary --->
      |
      v
Cart Agent (GPT-5.6 Sol, tool use)
      |
      v
Cart Output + Decision Log + Gap Report
~~~

## 3. Module Boundary

~~~text
EnrichmentProvider.enrich(raw_products: CSV) -> EnrichedIndex
~~~

The cart agent consumes EnrichedIndex and never reads raw product data or the source CSV. src/agent/ must never import from src/enrichment/; both modules may import contracts and types from src/shared/. After the hackathon, EnrichmentProvider is the pluggable boundary for external enrichment services.

## 4. Repository Structure

~~~text
forage/
  00_CONTEXT.md         # Shared product context and non-negotiable constraints
  PRD.md                # Product requirements and scored eval definitions
  AGENTS.md             # This operating manual
  README.md             # Setup, architecture, demos, evals, limitations
  data/
    apparel.csv         # Source catalog, read-only
  src/
    enrichment/         # Enrichment module only
    agent/              # Cart agent only
    shared/             # Types, interfaces, EnrichedIndex schema, utilities
    ui/                 # Frontend
  specs/
    scenarios.gherkin   # Executable demo and acceptance scenarios
  tasks/                # Small, ordered implementation tasks
  tests/                # Unit, integration, and agent-eval tests
~~~

## 5. Data Model

All monetary values are numbers in USD. productId is the CSV handle. The schemas below are implementation contracts, not sample payloads.

### Raw Product

~~~json
{
  "type": "object",
  "description": "One parsed CSV product variant.",
  "required": ["handle", "title", "body_html", "vendor", "type", "tags", "price", "image_src", "variant"],
  "properties": {
    "handle": {"type": "string", "description": "CSV Handle, stable product ID"},
    "title": {"type": "string", "description": "CSV Title"},
    "body_html": {"type": "string", "description": "CSV Body (HTML), normalized to text for prompts"},
    "vendor": {"type": "string", "description": "CSV Vendor"},
    "type": {"type": "string", "description": "CSV Type, may be empty"},
    "tags": {"type": "array", "items": {"type": "string"}, "description": "CSV Tags"},
    "price": {"type": "number", "description": "Variant Price"},
    "image_src": {"type": "string", "description": "CSV Image Src, may be empty"},
    "variant": {
      "type": "object",
      "description": "Variant-related CSV fields",
      "required": ["sku", "option_values", "grams", "inventory_tracker", "inventory_qty", "inventory_policy", "fulfillment_service", "compare_at_price", "requires_shipping", "taxable", "barcode", "image", "weight_unit", "tax_code"],
      "properties": {
        "sku": {"type": "string"}, "option_values": {"type": "array", "items": {"type": "string"}},
        "grams": {"type": "number"}, "inventory_tracker": {"type": "string"},
        "inventory_qty": {"type": "number"}, "inventory_policy": {"type": "string"},
        "fulfillment_service": {"type": "string"}, "compare_at_price": {"type": ["number", "null"]},
        "requires_shipping": {"type": "boolean"}, "taxable": {"type": "boolean"},
        "barcode": {"type": "string"}, "image": {"type": "string"},
        "weight_unit": {"type": "string"}, "tax_code": {"type": "string"}
      }
    }
  }
}
~~~

### Enriched Product

~~~json
{
  "type": "object",
  "description": "All Raw Product fields, plus agent-queryable attributes.",
  "required": ["handle", "title", "body_html", "vendor", "type", "tags", "price", "image_src", "variant", "material_composition", "use_case_tags", "aesthetic_style", "seasonal_relevance", "functional_attributes", "substitute_candidates", "confidence_scores"],
  "properties": {
    "handle": {"type": "string"}, "title": {"type": "string"}, "body_html": {"type": "string"},
    "vendor": {"type": "string"}, "type": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}},
    "price": {"type": "number"}, "image_src": {"type": "string"}, "variant": {"type": "object"},
    "material_composition": {"type": "array", "items": {"type": "string"}, "description": "Observed or defensible material terms"},
    "use_case_tags": {"type": "array", "items": {"type": "string"}, "description": "Occasions or contexts"},
    "aesthetic_style": {"type": "array", "items": {"type": "string"}, "description": "Style descriptors"},
    "seasonal_relevance": {"type": "array", "items": {"type": "string"}, "description": "Seasonal suitability"},
    "functional_attributes": {"type": "array", "items": {"type": "string"}, "description": "Observable functional features"},
    "substitute_candidates": {"type": "array", "items": {"type": "string"}, "description": "Candidate handles, not invented products"},
    "confidence_scores": {"type": "object", "additionalProperties": {"type": "number", "minimum": 0, "maximum": 1}, "description": "One 0.0-1.0 score per enriched field or value"}
  }
}
~~~

### Cart Output

~~~json
{
  "type": "object",
  "required": ["items", "total_price", "budget_limit", "budget_remaining", "constraints_met", "decision_log", "gap_report"],
  "properties": {
    "items": {"type": "array", "items": {"type": "object", "required": ["product_id", "title", "price", "justification", "slot"], "properties": {"product_id": {"type": "string"}, "title": {"type": "string"}, "price": {"type": "number"}, "justification": {"type": "string"}, "slot": {"type": "string"}}}},
    "total_price": {"type": "number"}, "budget_limit": {"type": "number"}, "budget_remaining": {"type": "number"},
    "constraints_met": {"type": "array", "items": {"type": "object", "properties": {"constraint": {"type": "string"}, "status": {"type": "string"}, "notes": {"type": "string"}}}},
    "decision_log": {"type": "array", "items": {"type": "object", "properties": {"step": {"type": "number"}, "tool_called": {"type": ["string", "null"]}, "inputs": {"type": "object"}, "outputs": {"type": "object"}, "reasoning": {"type": "string"}}}},
    "gap_report": {"type": "array", "items": {"type": "object", "properties": {"missing_attribute_or_category": {"type": "string"}, "recommendation": {"type": "string"}, "min_viable_price": {"type": ["number", "null"]}}}}
  }
}
~~~

## 6. Coding Conventions

- Use TypeScript. It is the fastest path to a typed frontend, API handlers, JSON schemas, and CLI scripts in one runtime.
- Use camelCase for variables and functions, PascalCase for types and interfaces, and UPPER_SNAKE for constants.
- Never swallow errors. Log redacted diagnostic context and surface the failure in the decision log or UI.
- No cross-module imports between src/enrichment/ and src/agent/. Both may import only from src/shared/.
- One primary export per file. Name the file for that export.
- Treat data/apparel.csv as read-only. Store generated index data outside data/.
- Trace from day one: include request ID, prompt version, model, tool name, redacted inputs and outputs, errors, retry count, latency, and token usage.

## 7. Agent Tool Schemas

These are strict OpenAI function-tool definitions. Each handler return contract is documented below its API schema; return values are not fields in an OpenAI tool definition.

### search_catalog

~~~json
{"type":"function","function":{"name":"search_catalog","description":"Search the enriched product index with structured filters.","strict":true,"parameters":{"type":"object","properties":{"use_case":{"type":["string","null"]},"aesthetic_style":{"type":["string","null"]},"price_min":{"type":["number","null"]},"price_max":{"type":["number","null"]},"functional_attributes":{"type":["array","null"],"items":{"type":"string"}},"keyword":{"type":["string","null"]}},"required":["use_case","aesthetic_style","price_min","price_max","functional_attributes","keyword"],"additionalProperties":false}}}
~~~

Returns: EnrichedProduct[].

### check_inventory

~~~json
{"type":"function","function":{"name":"check_inventory","description":"Check simulated stock status for a specific product.","strict":true,"parameters":{"type":"object","properties":{"product_id":{"type":"string"}},"required":["product_id"],"additionalProperties":false}}}
~~~

Returns: { "product_id": string, "in_stock": boolean, "quantity": number }.

### find_substitutes

~~~json
{"type":"function","function":{"name":"find_substitutes","description":"Find ranked alternatives for an out-of-stock item.","strict":true,"parameters":{"type":"object","properties":{"product_id":{"type":"string"},"match_use_case":{"type":["boolean","null"],"default":true},"max_price":{"type":["number","null"]}},"required":["product_id","match_use_case","max_price"],"additionalProperties":false}}}
~~~

Returns: EnrichedProduct[], ranked by similarity.

### add_to_cart

~~~json
{"type":"function","function":{"name":"add_to_cart","description":"Add a product to the cart with a justification and cart role.","strict":true,"parameters":{"type":"object","properties":{"product_id":{"type":"string"},"justification":{"type":"string"},"slot":{"type":"string","description":"The role this item fills in the cart"}},"required":["product_id","justification","slot"],"additionalProperties":false}}}
~~~

Returns: { "success": boolean, "cart_total": number, "budget_remaining": number }.

### get_cart_summary

~~~json
{"type":"function","function":{"name":"get_cart_summary","description":"Get current cart state.","strict":true,"parameters":{"type":"object","properties":{},"required":[],"additionalProperties":false}}}
~~~

Returns: the complete CartOutput object without decision_log.

## 8. Tool Policy

- The enrichment module calls no tools. It performs batch GPT-5.6 API enrichment.
- The cart agent may call only the five tools in Section 7.
- Neither module may modify the source CSV, and the agent may not modify enriched product data.
- The tool layer validates arguments, logs every call automatically, and records normalized inputs, outputs, result status, latency, and failures in the decision log.
- Tool handler errors must produce a visible log entry and a retry or gap report, never a fabricated result.

## 9. Enrichment Module Prompt

### System Instructions

~~~text
You enrich one raw apparel product into structured, agent-queryable data. Read only the supplied raw product. Detect product category from the title and description. Generate material_composition, use_case_tags, aesthetic_style, seasonal_relevance, and functional_attributes only when defensible from the text. Find substitute_candidates only from the supplied candidate handles, based on compatible category, use case, and price.

Assign confidence_scores for every enriched field or value: 1.0 when directly stated, 0.5-0.9 for a reasonable inference, and below 0.5 only for a speculative inference. Do not add care instructions, material percentages, sizing information, inventory facts, or product facts absent from the title or description. If the description is empty or sparse, use the title only and assign every enriched confidence score below 0.5. Return only JSON conforming to the supplied Enriched Product schema.
~~~

### Structured Output Schema

Return the Enriched Product JSON schema defined in Section 5, including all raw fields. substitute_candidates must contain only supplied catalog handles. confidence_scores maps every emitted enriched field or value to a number from 0.0 through 1.0.

### Anti-Hallucination Constraints

- Generate only attributes defensible from the source title and description.
- Mark observed attributes with confidence 1.0; inferred attributes must be below 1.0.
- Never invent care instructions, material percentages, or sizing details.
- If the description is empty or too sparse, enrich from title only and keep every confidence score below 0.5.

### Worked Example

Input:

~~~json
{"handle":"ocean-blue-shirt","title":"Ocean Blue Shirt","body_html":"Ocean blue cotton shirt with a narrow collar and buttons down the front and long sleeves. Comfortable fit and tiled kalidoscope patterns.","vendor":"partners-demo","type":"","tags":["men"],"price":50,"image_src":"https://burst.shopifycdn.com/photos/young-man-in-bright-fashion_925x.jpg","variant":{"sku":"","option_values":["Default Title"],"grams":0,"inventory_tracker":"","inventory_qty":1,"inventory_policy":"deny","fulfillment_service":"manual","compare_at_price":null,"requires_shipping":true,"taxable":true,"barcode":"","image":"","weight_unit":"kg","tax_code":""}}
~~~

Output:

~~~json
{"handle":"ocean-blue-shirt","title":"Ocean Blue Shirt","body_html":"Ocean blue cotton shirt with a narrow collar and buttons down the front and long sleeves. Comfortable fit and tiled kalidoscope patterns.","vendor":"partners-demo","type":"","tags":["men"],"price":50,"image_src":"https://burst.shopifycdn.com/photos/young-man-in-bright-fashion_925x.jpg","variant":{"sku":"","option_values":["Default Title"],"grams":0,"inventory_tracker":"","inventory_qty":1,"inventory_policy":"deny","fulfillment_service":"manual","compare_at_price":null,"requires_shipping":true,"taxable":true,"barcode":"","image":"","weight_unit":"kg","tax_code":""},"material_composition":["cotton"],"use_case_tags":["casual"],"aesthetic_style":["patterned","colorful"],"seasonal_relevance":[],"functional_attributes":["long_sleeves","button_front","narrow_collar"],"substitute_candidates":[],"confidence_scores":{"material_composition.cotton":1.0,"use_case_tags.casual":0.7,"aesthetic_style.patterned":1.0,"aesthetic_style.colorful":0.7,"functional_attributes.long_sleeves":1.0,"functional_attributes.button_front":1.0,"functional_attributes.narrow_collar":1.0}}
~~~

## 10. Agent System Prompt

### Role

~~~text
You are a shopping agent that composes multi-item carts from structured product data. You do not search; you solve.
~~~

### Behavioral Instructions

~~~text
Before calling a tool, decompose the shopping goal into stated constraints and inferred constraints. Record them in the decision log. Infer reasonable occasion, compatibility, and style constraints without inventing user preferences.

Treat budget as a hard limit across the entire cart. After every add_to_cart call, inspect budget_remaining. Before adding another item that would exceed budget, find a cheaper compatible option or record a constraint conflict.

Check inventory before committing a selected item. If it is out of stock, call find_substitutes. After adding any substitute, recheck the full budget and reconsider dependent choices if the substitute changes price or compatibility.

When a needed constraint has zero matches, retry search_catalog once with one safely relaxed filter. If it still has zero matches, report the missing attribute or category, the closest available option, and the catalog additions and minimum viable price that would resolve the gap.
~~~

### Decision Rules

- Recommend only products present in the enriched index.
- Never exceed budget unless the decision log explicitly flags the unsatisfied hard constraint. Do not add an over-budget item.
- Log every tool call, including inputs and outputs.
- Complete every requested item or slot. Never stop after one or two items.
- Prefer a truthful gap report to a silent error or an invented match.

### Output Format

Return a JSON object conforming to CartOutput in Section 5:

~~~text
{ items, total_price, budget_limit, budget_remaining,
  constraints_met, decision_log, gap_report }
~~~

## 11. Commands

~~~bash
# Start dev server
npm run dev

# Run tests
npm test

# Load sample data and run enrichment
npm run enrich

# Run a single agent scenario from CLI
npm run agent "business casual outfit for a job interview, budget $150"

# Deploy to Railway
railway up
~~~

## 12. Constraints and Guardrails

- GPT-5.6 is the only runtime model: Terra enriches, Sol composes carts.
- Keep enrichment and agent modules separate behind the EnrichedIndex interface.
- Every enriched attribute must be traceable to source data with confidence scores.
- Never hallucinate a product not in the enriched index.
- Budget is a hard limit.
- Log every tool call in the decision log.
- Prefer graceful failure with a specific gap report over silent errors or invented matches.
- Attempt every requested item in a multi-item request before returning.
- Treat the four evals in PRD.md as acceptance criteria. Do not call a behavior complete unless each reaches its threshold.
