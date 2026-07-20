import { deriveQueryStats } from "../../shared/query-stats.js";
import type { CartOutput } from "../../shared/types.js";

const INPUT_COST_PER_MILLION = 10;
const OUTPUT_COST_PER_MILLION = 30;

export function QueryStats({ cart }: { cart: CartOutput }) {
  const stats = cart.stats ?? deriveQueryStats(cart.decision_log);
  const estimatedCost = (stats.input_tokens * INPUT_COST_PER_MILLION + stats.output_tokens * OUTPUT_COST_PER_MILLION) / 1_000_000;

  return (
    <section className="query-stats" aria-label="Query statistics">
      <div><strong>Query Stats</strong><span>{stats.tool_calls_count} tool calls, {stats.reasoning_steps} reasoning steps</span></div>
      <div><span>{stats.total_tokens.toLocaleString()} total tokens</span><span>~${estimatedCost.toFixed(3)} estimated cost</span></div>
      <small>Estimate uses $10 per 1M input tokens and $30 per 1M output tokens.</small>
    </section>
  );
}
