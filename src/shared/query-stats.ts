import type { DecisionLogEntry, QueryStats } from "./types.js";

interface TraceUsage {
  input_tokens?: unknown;
  output_tokens?: unknown;
  total_tokens?: unknown;
}

function safeTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Extracts cumulative model usage recorded on the latest available tool trace. */
export function deriveQueryStats(entries: DecisionLogEntry[]): QueryStats {
  let usage: TraceUsage = {};
  for (const entry of entries) {
    const trace = entry.outputs.trace;
    if (typeof trace !== "object" || trace === null || Array.isArray(trace)) continue;
    const candidate = (trace as Record<string, unknown>).token_usage;
    if (typeof candidate === "object" && candidate !== null && !Array.isArray(candidate)) usage = candidate as TraceUsage;
  }

  const inputTokens = safeTokenCount(usage.input_tokens);
  const outputTokens = safeTokenCount(usage.output_tokens);
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: safeTokenCount(usage.total_tokens) || inputTokens + outputTokens,
    tool_calls_count: entries.filter((entry) => entry.tool_called !== null).length,
    reasoning_steps: entries.length,
  };
}
