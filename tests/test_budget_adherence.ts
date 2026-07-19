import { runInterviewAgent, runOverBudgetAgent } from "./agent-test-fixture.js";

test("test_cart_total_within_budget", async () => {
  const output = await runInterviewAgent();
  expect(output.total_price).toBe(120);
  expect(output.budget_remaining).toBe(30);
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  const additions = output.decision_log.filter((entry) => entry.tool_called === "add_to_cart");
  const summaries = output.decision_log.filter((entry) => entry.tool_called === "get_cart_summary");
  expect(additions).toHaveLength(3);
  expect(summaries).toHaveLength(additions.length);
});

test("test_budget_exceeded_flagged_in_log", async () => {
  const output = await runOverBudgetAgent();
  expect(output.total_price).toBe(70);
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  expect(output.decision_log).toContainEqual(expect.objectContaining({
    tool_called: "add_to_cart",
    outputs: expect.objectContaining({ status: "failure", error: expect.stringContaining("exceed the shared budget") }),
  }));
  expect(output.gap_report).toContainEqual(expect.objectContaining({ missing_attribute_or_category: "footwear" }));
});
