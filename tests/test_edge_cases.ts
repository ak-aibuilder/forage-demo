import { CartState } from "../src/agent/cart-state.js";
import { redact, traced } from "../src/agent/tools/trace.js";
import { publicCartError } from "../src/shared/public-cart-error.js";
import { runInvalidRelaxationAgent, runIterationCapAgent, runLowBudgetAgent, runNonsenseApproximationAgent, runNonsenseGapAgent } from "./agent-test-fixture.js";

test("a budget below every compatible item reports the true minimum catalog cost", async () => {
  const output = await runLowBudgetAgent();
  expect(output.items).toEqual([]);
  expect(output.gap_report[0]?.min_viable_price).toBeGreaterThan(10);
  expect(output.gap_report[0]?.recommendation).toMatch(/minimum viable catalog cost is \$\d+\.\d{2}/i);
});

test("a nonsensical request retries once and returns a specific gap", async () => {
  const output = await runNonsenseGapAgent();
  const searches = output.decision_log.filter((entry) => entry.tool_called === "search_catalog");
  expect(searches).toHaveLength(2);
  expect(searches[1]?.reasoning).toContain("1 changed filter");
  expect(output.items).toEqual([]);
  expect(output.gap_report[0]?.missing_attribute_or_category).toContain("purple elephant tuxedo for mars");
});

test("a product missing hard requested attributes is rejected as an approximation", async () => {
  const output = await runNonsenseApproximationAgent();
  expect(output.items).toEqual([]);
  expect(output.gap_report[0]?.missing_attribute_or_category).toContain("purple elephant tuxedo for mars");
  expect(output.decision_log.find((entry) => entry.tool_called === "add_to_cart")?.outputs).toMatchObject({
    status: "failure",
    error: expect.stringContaining("hard product attributes"),
  });
});

test("the relaxed retry rejects changes to more than one filter", async () => {
  const output = await runInvalidRelaxationAgent();
  const searches = output.decision_log.filter((entry) => entry.tool_called === "search_catalog");
  expect(searches).toHaveLength(2);
  expect(searches[1]?.outputs).toMatchObject({ status: "failure", error: expect.stringContaining("exactly one filter") });
  expect(output.gap_report).not.toEqual([]);
});

test("the tool cap returns partial results with an explicit explanation", async () => {
  const output = await runIterationCapAgent();
  expect(output.items).toHaveLength(1);
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  expect(output.decision_log.at(-1)?.reasoning).toContain("safety limit");
  expect(output.gap_report.map((gap) => gap.missing_attribute_or_category)).toEqual(expect.arrayContaining(["outer layer", "bag"]));
});

test("trace records carry redacted request metadata and usage", () => {
  const state = new CartState(100);
  state.setRunTraceContext({ request_id: "req-trace", prompt_version: "prompt-v1", model: "gpt-5.6-sol", retry_count: 1, model_latency_ms: 42, token_usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 } });
  traced(state, "test_tool", { authorization: "Bearer private", nested: { api_key: "secret", safe: "visible" } }, () => ({ access_token: "private", result: "ok" }));
  const entry = state.output().decision_log[0];
  expect(entry.inputs).toEqual({ authorization: "[REDACTED]", nested: { api_key: "[REDACTED]", safe: "visible" } });
  expect(entry.outputs).toMatchObject({ access_token: "[REDACTED]", status: "success", trace: { request_id: "req-trace", prompt_version: "prompt-v1", model: "gpt-5.6-sol", retry_count: 1, model_latency_ms: 42, token_usage: { total_tokens: 15 } } });
  expect(redact({ password: "nope", value: 2 })).toEqual({ password: "[REDACTED]", value: 2 });
});

test("API failures map to actionable public errors without leaking upstream bodies", () => {
  expect(publicCartError(new Error("The cart agent timed out. secret payload"))).toEqual({ message: "The cart agent timed out. Please try again.", status: 504 });
  const upstream = publicCartError(new Error("Cart agent request failed with status 429: private upstream body"));
  expect(upstream).toEqual({ message: "The cart service could not reach the agent (status 429). Please try again.", status: 502 });
  expect(upstream.message).not.toContain("private upstream body");
});
