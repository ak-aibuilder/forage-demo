import { runCottonShirtAgent, runFormalGapAgent, runInterviewAgent, runOverBudgetAgent, runSubstituteBudgetConflictAgent, runSubstitutionAgent, runWaterproofGapAgent } from "./agent-test-fixture.js";

test("Gherkin 1: explicit cotton-shirt search", async () => {
  const output = await runCottonShirtAgent();
  expect(output.items).toContainEqual(expect.objectContaining({ product_id: "white-cotton-shirt", slot: "shirt" }));
  expect(output.decision_log[0]?.outputs.explicit_constraints).toEqual(expect.arrayContaining(["cotton", "$60 maximum", "shirt slot"]));
  expect(output.decision_log[0]?.outputs.implicit_constraints).toEqual([]);
});

test("Gherkin 2: implicit interview outfit", async () => {
  const output = await runInterviewAgent();
  expect(output.items).toHaveLength(3);
  expect(output.decision_log[0]?.outputs.implicit_constraints).toEqual(expect.arrayContaining(["professional", "polished", "non-formal", "neutral styling"]));
});

test("Gherkin 3: shared budget allocation", async () => {
  const output = await runInterviewAgent();
  expect(output).toMatchObject({ total_price: 120, budget_remaining: 30 });
  expect(output.decision_log.filter((entry) => entry.tool_called === "get_cart_summary")).toHaveLength(3);
});

test("Gherkin 4: over-budget candidate replan", async () => {
  const output = await runOverBudgetAgent();
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  expect(output.decision_log).toContainEqual(expect.objectContaining({ tool_called: "add_to_cart", outputs: expect.objectContaining({ status: "failure" }) }));
});

test("Gherkin 5: stockout substitution", async () => {
  const output = await runSubstitutionAgent();
  expect(output.items).toHaveLength(3);
  expect(output.decision_log.map((entry) => entry.tool_called)).toEqual(expect.arrayContaining(["check_inventory", "find_substitutes", "get_cart_summary"]));
});

test("Gherkin 6: expensive substitute rebalance", async () => {
  const output = await runSubstituteBudgetConflictAgent();
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  expect(output.gap_report).toContainEqual(expect.objectContaining({ missing_attribute_or_category: "shirt" }));
});

test("Gherkin 7: impossible formal request", async () => {
  const output = await runFormalGapAgent();
  expect(output.gap_report[0]).toMatchObject({ missing_attribute_or_category: "formal evening gown", min_viable_price: 60 });
  expect(output.gap_report[0]?.recommendation).toContain("Blue Silk Tuxedo at $70.00");
});

test("Gherkin 8: one relaxed retry", async () => {
  const output = await runWaterproofGapAgent();
  expect(output.decision_log.filter((entry) => entry.tool_called === "search_catalog")).toHaveLength(2);
  expect(output.gap_report[0]?.missing_attribute_or_category).toBe("waterproof shirt");
});
