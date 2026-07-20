import { deriveQueryStats } from "../src/shared/query-stats.js";
import type { DecisionLogEntry } from "../src/shared/types.js";

test("query stats use the latest cumulative trace usage", () => {
  const entries: DecisionLogEntry[] = [
    { step: 1, tool_called: null, inputs: {}, outputs: {}, reasoning: "Decompose." },
    { step: 2, tool_called: "search_catalog", inputs: {}, outputs: { trace: { token_usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 } } }, reasoning: "Search." },
    { step: 3, tool_called: "add_to_cart", inputs: {}, outputs: { trace: { token_usage: { input_tokens: 250, output_tokens: 75, total_tokens: 325 } } }, reasoning: "Add." },
  ];

  expect(deriveQueryStats(entries)).toEqual({
    input_tokens: 250,
    output_tokens: 75,
    total_tokens: 325,
    tool_calls_count: 2,
    reasoning_steps: 3,
  });
});
