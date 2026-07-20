import type { CartOutput, EnrichedIndex, EnrichedProduct } from "../shared/types.js";
import { decomposeShoppingGoal, type ShoppingIntent } from "./decision-log.js";
import { createGapReport } from "./gap-reporter.js";
import { createAgentTools } from "./tools/index.js";
import { inventoryQuantity, type InventoryConfig } from "./tools/check-inventory.js";

export const AGENT_SYSTEM_PROMPT = `You are a shopping agent that composes multi-item carts from structured product data. You do not search; you solve.

Before calling a tool, decompose the shopping goal into stated constraints and inferred constraints. Record them in the decision log. Infer reasonable occasion, compatibility, and style constraints without inventing user preferences.

Treat budget as a hard limit across the entire cart. After every add_to_cart call, inspect budget_remaining. Before adding another item that would exceed budget, find a cheaper compatible option or record a constraint conflict.

Check inventory before committing a selected item. If it is out of stock, call find_substitutes. After adding any substitute, recheck the full budget and reconsider dependent choices if the substitute changes price or compatibility.

When a needed constraint has zero matches, retry search_catalog once with one safely relaxed filter. If it still has zero matches, report the missing attribute or category, the closest available option, and the catalog additions and minimum viable price that would resolve the gap.

Decision rules:
- Recommend only products present in the enriched index.
- Never exceed budget unless the decision log explicitly flags the unsatisfied hard constraint. Do not add an over-budget item.
- Log every tool call, including inputs and outputs.
- Complete every requested item or slot. Never stop after one or two items.
- Prefer a truthful gap report to a silent error or an invented match.

Return a JSON object conforming to CartOutput: { items, total_price, budget_limit, budget_remaining, constraints_met, decision_log, gap_report }.`;

type ResponseInputItem = Record<string, unknown>;
export interface AgentResponse {
  id?: string;
  output: Array<Record<string, unknown>>;
}
export type AgentTransport = (body: Record<string, unknown>) => Promise<AgentResponse>;

export interface CartAgentOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;
  maxToolCalls?: number;
  transport?: AgentTransport;
}

const SLOT_ALIASES: Record<string, string[]> = {
  shirt: ["shirt", "top"],
  top: ["top", "shirt", "blouse", "tee"],
  "outer layer": ["outer layer", "outerwear", "jacket", "jumper"],
  bag: ["bag", "accessory"],
  bottom: ["bottom", "pants", "trousers"],
  skirt: ["skirt", "bottom"],
  footwear: ["footwear", "shoes", "sneakers", "high tops"],
  gown: ["gown", "dress"],
  item: ["item"],
};

interface AgentRunContext {
  inventoryStatus: Map<string, boolean>;
  substituteOrigins: Map<string, string>;
  lastStockout?: string;
  lastSubstitution?: { original: string; selected: string };
  previousSearchWasEmpty: boolean;
}

const FILTER_KEYS = ["use_case", "aesthetic_style", "price_min", "price_max", "functional_attributes", "keyword"] as const;

function searchFilterChanges(previous: Record<string, unknown>, current: Record<string, unknown>): number {
  return FILTER_KEYS.filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key])).length;
}

function productSearchText(product: EnrichedProduct): string {
  return [product.title, product.bodyHtml, ...product.tags, ...product.materialComposition, ...product.useCaseTags, ...product.aestheticStyle, ...product.functionalAttributes]
    .join(" ")
    .toLowerCase()
    .replace(/_/g, " ");
}

function productCategory(product: EnrichedProduct): string {
  const text = `${product.title} ${product.bodyHtml}`.toLowerCase();
  if (/bag/.test(text)) return "bag";
  if (/jacket|tuxedo|jumper/.test(text)) return "outer layer";
  if (/shirt|blouse|top|tee/.test(text)) return "top";
  if (/skirt|pants|trousers/.test(text)) return "bottom";
  if (/shoe|high tops|sneaker/.test(text)) return "footwear";
  return "other";
}

const satisfiesSlot = (required: string, actual: string): boolean => {
  const normalized = actual.trim().toLowerCase();
  return (SLOT_ALIASES[required] ?? [required]).some((alias) => normalized.includes(alias));
};

function responseTools(schemas: ReturnType<typeof createAgentTools>["schemas"]): Array<Record<string, unknown>> {
  return schemas.map(({ function: definition }) => ({ type: "function", ...definition }));
}

function parseArguments(item: Record<string, unknown>): Record<string, unknown> {
  if (typeof item.arguments !== "string") throw new Error("Function call arguments must be a JSON string.");
  const parsed = JSON.parse(item.arguments) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Function call arguments must be an object.");
  return parsed as Record<string, unknown>;
}

export class CartAgent {
  private readonly apiBaseUrl: string;
  private readonly model: string;
  private readonly maxToolCalls: number;
  private readonly transport: AgentTransport;

  public constructor(
    private readonly index: EnrichedIndex,
    private readonly budgetLimit: number,
    private readonly inventory: InventoryConfig = {},
    options: CartAgentOptions = {},
  ) {
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.openai.com/v1";
    this.model = options.model ?? "gpt-5.6-sol";
    this.maxToolCalls = options.maxToolCalls ?? 15;
    const apiKey = options.apiKey;
    this.transport = options.transport ?? (async (body) => {
      if (!apiKey) throw new Error("OPENAI_API_KEY is required to run the cart agent.");
      const response = await fetch(`${this.apiBaseUrl}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Cart agent request failed with status ${response.status}: ${(await response.text()).slice(0, 800)}`);
      return response.json() as Promise<AgentResponse>;
    });
  }

  public async run(goal: string): Promise<CartOutput> {
    if (!goal.trim()) throw new Error("Shopping goal must not be empty.");
    const tools = createAgentTools(this.index, this.budgetLimit, this.inventory);
    const intent = decomposeShoppingGoal(goal, this.budgetLimit);
    this.recordIntent(tools.state, goal, intent);

    const input: ResponseInputItem[] = [{
      role: "user",
      content: `Shopping goal: ${goal}\nHard budget: $${this.budgetLimit}\nRequired slots: ${intent.requiredSlots.join(", ")}\nRecorded explicit constraints: ${intent.explicitConstraints.join(", ")}\nRecorded implicit constraints: ${intent.implicitConstraints.join(", ")}\nUse one search per required slot, check inventory before adding, and fill every slot. For the initial search for each slot, set use_case, aesthetic_style, and functional_attributes to null; use the literal required category as keyword, such as shirt, jacket for outer layer, bag, or gown; and apply the remaining budget as price_max. Evaluate the returned enriched attributes against the recorded constraints. Use a structured filter only when an exact normalized tag appeared in an earlier tool result. If a search is empty, retry once by relaxing exactly one filter. When check_inventory reports a stockout, call find_substitutes for the original product, check the selected substitute's inventory, reserve enough budget for unfilled slots, and recheck the full cart immediately after adding the substitute.`,
    }];
    let toolCallCount = 0;
    let previousSearchArgs: Record<string, unknown> | undefined;
    const context: AgentRunContext = { inventoryStatus: new Map(), substituteOrigins: new Map(), previousSearchWasEmpty: false };

    while (toolCallCount < this.maxToolCalls) {
      const response = await this.transport({
        model: this.model,
        reasoning: { effort: "high" },
        instructions: AGENT_SYSTEM_PROMPT,
        tools: responseTools(tools.schemas),
        parallel_tool_calls: false,
        input,
      });
      const calls = response.output.filter((item) => item.type === "function_call");
      input.push(...response.output);

      if (calls.length === 0) {
        this.reportMissingSlots(tools.state, intent, goal, "The agent ended before this required slot was fulfilled.");
        return tools.state.output();
      }

      for (const call of calls) {
        if (toolCallCount >= this.maxToolCalls) break;
        const name = String(call.name ?? "");
        const args = parseArguments(call);
        const reasoning = this.toolReasoning(name, args, intent, context, previousSearchArgs);
        tools.state.setNextToolReasoning(reasoning);
        let result: unknown;
        try {
          result = this.dispatchTool(tools, name, args, context);
        } catch (error) {
          result = { error: error instanceof Error ? error.message : "Unknown tool error" };
        }
        toolCallCount += 1;

        if (name === "search_catalog" && Array.isArray(result)) {
          context.previousSearchWasEmpty = result.length === 0;
          previousSearchArgs = args;
        }

        if (name === "add_to_cart" && !(typeof result === "object" && result !== null && "error" in result) && toolCallCount < this.maxToolCalls) {
          const swap = context.lastSubstitution;
          tools.state.setNextToolReasoning(swap
            ? `Recheck the full-cart budget after replacing ${swap.original} with ${swap.selected}; reconsider dependent choices if the revised total conflicts with the hard limit.`
            : "Inspect the authoritative cart total and budget remaining immediately after the cart addition.");
          const summary = tools.get_cart_summary();
          toolCallCount += 1;
          result = { ...(result as Record<string, unknown>), post_add_cart_summary: summary };
          context.lastSubstitution = undefined;
        }

        input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result) });
      }
    }

    this.reportMissingSlots(tools.state, intent, goal, `The ${this.maxToolCalls}-tool-call safety limit was reached.`);
    return tools.state.output();
  }

  private recordIntent(state: ReturnType<typeof createAgentTools>["state"], goal: string, intent: ShoppingIntent): void {
    state.recordDecision({
      tool_called: null,
      inputs: { shopping_goal: goal, budget_limit: this.budgetLimit },
      outputs: { explicit_constraints: intent.explicitConstraints, implicit_constraints: intent.implicitConstraints, required_slots: intent.requiredSlots },
      reasoning: "Decomposed the goal into stated and defensible inferred constraints before the first tool call.",
    });
    for (const constraint of intent.explicitConstraints) state.addConstraint({ constraint, status: "required", notes: "Explicitly stated or directly parsed from the shopping goal." });
    for (const constraint of intent.implicitConstraints) state.addConstraint({ constraint, status: "inferred", notes: "Defensibly inferred from the occasion and context." });
  }

  private reportMissingSlots(state: ReturnType<typeof createAgentTools>["state"], intent: ShoppingIntent, goal: string, reason: string): void {
    const items = state.summary().items;
    for (const slot of intent.requiredSlots) {
      if (!items.some((item) => satisfiesSlot(slot, item.slot))) {
        const missing = this.gapLabel(goal, slot);
        state.addGap(createGapReport(missing, state.budgetRemaining, reason, this.findClosestProduct(goal, slot, items.map((item) => item.product_id))));
      }
    }
  }

  private toolReasoning(name: string, args: Record<string, unknown>, intent: ShoppingIntent, context: AgentRunContext, previousSearchArgs?: Record<string, unknown>): string {
    const productId = String(args.product_id ?? "");
    if (name === "find_substitutes") return `Replan the ${productId} selection after its stockout, preserving use-case compatibility and the budget needed for every remaining slot.`;
    if (name === "check_inventory" && context.substituteOrigins.has(productId)) return `Verify that substitute ${productId} is available before replacing ${context.substituteOrigins.get(productId)}.`;
    if (name === "add_to_cart" && context.substituteOrigins.has(productId)) return `Select ${productId} as the available substitute for ${context.substituteOrigins.get(productId)} and preserve the remaining-slot budget.`;
    if (name === "search_catalog" && context.previousSearchWasEmpty && previousSearchArgs) {
      const changes = searchFilterChanges(previousSearchArgs, args);
      return `Retry the zero-result catalog query with ${changes} changed filter${changes === 1 ? "" : "s"}; exactly one safely relaxed constraint is required before reporting a gap.`;
    }
    return `Use ${name} to advance the required ${intent.requiredSlots.join(", ")} slots while preserving the shared budget.`;
  }

  private gapLabel(goal: string, slot: string): string {
    const normalized = goal.toLowerCase();
    if (/formal/.test(normalized) && /evening/.test(normalized) && /gown|outfit/.test(normalized)) return "formal evening gown";
    if (/waterproof/.test(normalized)) return `waterproof ${slot}`;
    return slot;
  }

  private findClosestProduct(goal: string, slot: string, excludedIds: string[]): { title: string; price: number } | undefined {
    const normalizedGoal = goal.toLowerCase();
    const tokens = normalizedGoal.match(/[a-z]+/g)?.filter((token) => !["a", "an", "and", "for", "under", "the", "with", "budget"].includes(token)) ?? [];
    const candidates = this.index.products
      .filter((product) => !excludedIds.includes(product.handle) && inventoryQuantity(this.inventory, product.handle) > 0)
      .map((product) => {
        const text = productSearchText(product);
        let score = tokens.filter((token) => text.includes(token)).length;
        if (/formal|evening/.test(normalizedGoal) && /formal|evening/.test(text)) score += 8;
        if (/waterproof/.test(normalizedGoal) && /waterproof|wet weather/.test(text)) score += 8;
        if ((SLOT_ALIASES[slot] ?? [slot]).some((alias) => text.includes(alias))) score += 4;
        return { product, score };
      })
      .sort((left, right) => right.score - left.score || left.product.price - right.product.price);
    const closest = candidates[0]?.product;
    return closest ? { title: closest.title, price: closest.price } : undefined;
  }

  private dispatchTool(tools: ReturnType<typeof createAgentTools>, name: string, args: Record<string, unknown>, context: AgentRunContext): unknown {
    switch (name) {
      case "search_catalog": return tools.search_catalog(args as unknown as Parameters<typeof tools.search_catalog>[0]);
      case "check_inventory": {
        const result = tools.check_inventory(args as unknown as Parameters<typeof tools.check_inventory>[0]);
        context.inventoryStatus.set(result.product_id, result.in_stock);
        if (!result.in_stock) context.lastStockout = result.product_id;
        return result;
      }
      case "find_substitutes": {
        const result = tools.find_substitutes(args as unknown as Parameters<typeof tools.find_substitutes>[0]);
        const original = String(args.product_id ?? context.lastStockout ?? "");
        const originalProduct = this.index.products.find((product) => product.handle === original);
        for (const product of result) {
          if (!originalProduct || productCategory(product) === productCategory(originalProduct)) context.substituteOrigins.set(product.handle, original);
        }
        return result;
      }
      case "add_to_cart": {
        const productId = String(args.product_id ?? "");
        if (context.inventoryStatus.get(productId) !== true) {
          const error = context.inventoryStatus.get(productId) === false
            ? `Cannot add ${productId}; its inventory check reported out of stock.`
            : `Cannot add ${productId} before a successful inventory check.`;
          tools.state.recordTrace({ toolName: "add_to_cart", inputs: args, outputs: {}, status: "failure", latencyMs: 0, error });
          throw new Error(error);
        }
        const result = tools.add_to_cart(args as unknown as Parameters<typeof tools.add_to_cart>[0]);
        const unresolved = context.lastStockout ? this.index.products.find((product) => product.handle === context.lastStockout) : undefined;
        const selected = this.index.products.find((product) => product.handle === productId);
        const original = context.substituteOrigins.get(productId)
          ?? (unresolved && selected && productCategory(unresolved) === productCategory(selected) ? unresolved.handle : undefined);
        if (original) {
          context.lastSubstitution = { original, selected: productId };
          context.lastStockout = undefined;
          for (const [candidate, candidateOriginal] of context.substituteOrigins) {
            if (candidateOriginal === original) context.substituteOrigins.delete(candidate);
          }
        }
        return result;
      }
      case "get_cart_summary": return tools.get_cart_summary();
      default:
        tools.state.recordTrace({ toolName: name || "unknown_tool", inputs: args, outputs: {}, status: "failure", latencyMs: 0, error: "Unknown tool requested." });
        throw new Error(`Unknown tool requested: ${name}`);
    }
  }
}
