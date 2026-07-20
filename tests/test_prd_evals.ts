import { runBudget130Agent, runDoubleStockoutAgent, runInterviewAgent } from "./agent-test-fixture.js";

test("PRD eval 1 intent decomposition scores 5 of 5, threshold 4", async () => {
  const output = await runInterviewAgent();
  const inferred = output.decision_log[0]?.outputs.implicit_constraints as string[];
  const score = ["professional", "polished", "non-formal", "neutral styling"].every((constraint) => inferred.includes(constraint)) && output.items.length === 3 ? 5 : 0;
  expect(score).toBeGreaterThanOrEqual(4);
});

test("PRD eval 2 cart completeness scores 5 of 5, threshold 4", async () => {
  const output = await runInterviewAgent();
  const slots = new Set(output.items.map((item) => item.slot));
  const score = ["shirt", "outer layer", "bag"].every((slot) => slots.has(slot)) && output.items.every((item) => item.justification.length > 0) ? 5 : 0;
  expect(score).toBeGreaterThanOrEqual(4);
});

test("PRD eval 3 substitution and replanning scores 5 of 5, threshold 4", async () => {
  const output = await runDoubleStockoutAgent();
  const stockouts = output.decision_log.filter((entry) => entry.tool_called === "check_inventory" && entry.outputs.in_stock === false);
  const substitutions = output.decision_log.filter((entry) => entry.tool_called === "find_substitutes");
  const score = stockouts.length === 2 && substitutions.length === 2 && output.total_price <= output.budget_limit && output.gap_report.some((gap) => gap.missing_attribute_or_category === "bag") ? 5 : 0;
  expect(score).toBeGreaterThanOrEqual(4);
});

test("PRD eval 4 budget adherence scores 5 of 5, threshold 4", async () => {
  const output = await runBudget130Agent();
  const score = output.items.length === 3 && output.total_price === 120 && output.budget_remaining === 10 && output.total_price <= 130 ? 5 : 0;
  expect(score).toBeGreaterThanOrEqual(4);
});
