import { runFormalGapAgent, runSubstituteBudgetConflictAgent, runSubstitutionAgent, runWaterproofGapAgent } from "./agent-test-fixture.js";

test("test_out_of_stock_triggers_substitution", async () => {
  const output = await runSubstitutionAgent();
  const calls = output.decision_log.map((entry) => entry.tool_called);
  const stockoutAt = calls.indexOf("check_inventory");
  const substituteAt = calls.indexOf("find_substitutes");
  expect(stockoutAt).toBeGreaterThan(0);
  expect(output.decision_log[stockoutAt].outputs).toMatchObject({ product_id: "white-cotton-shirt", in_stock: false });
  expect(substituteAt).toBeGreaterThan(stockoutAt);
  expect(output.items).toContainEqual(expect.objectContaining({ product_id: "longsleeve-cotton-top", slot: "shirt" }));
  expect(output.items).toHaveLength(3);
  expect(output.gap_report).toEqual([]);
});

test("test_budget_rechecked_after_substitution", async () => {
  const output = await runSubstitutionAgent();
  const substituteAddAt = output.decision_log.findIndex((entry) => entry.tool_called === "add_to_cart" && entry.inputs.product_id === "longsleeve-cotton-top");
  const summary = output.decision_log[substituteAddAt + 1];
  expect(summary.tool_called).toBe("get_cart_summary");
  expect(summary.outputs).toMatchObject({ total_price: 50, budget_remaining: 100 });
  expect(summary.reasoning).toContain("replacing white-cotton-shirt with longsleeve-cotton-top");
  expect(output).toMatchObject({ total_price: 140, budget_remaining: 10 });
});

test("test_decision_log_shows_substitution_chain", async () => {
  const output = await runSubstitutionAgent();
  const chain = output.decision_log.filter((entry) => ["check_inventory", "find_substitutes", "add_to_cart", "get_cart_summary"].includes(entry.tool_called ?? ""));
  expect(chain.find((entry) => entry.tool_called === "find_substitutes")?.inputs.product_id).toBe("white-cotton-shirt");
  expect(chain.find((entry) => entry.tool_called === "find_substitutes")?.reasoning).toContain("stockout");
  expect(chain.find((entry) => entry.tool_called === "add_to_cart" && entry.inputs.product_id === "longsleeve-cotton-top")?.reasoning).toContain("substitute for white-cotton-shirt");
  expect(chain.find((entry) => entry.tool_called === "add_to_cart" && entry.inputs.product_id === "black-leather-bag")?.reasoning).not.toContain("substitute for white-cotton-shirt");
});

test("over-budget substitute triggers a cheaper replan or blocking gap", async () => {
  const output = await runSubstituteBudgetConflictAgent();
  expect(output.total_price).toBe(90);
  expect(output.total_price).toBeLessThanOrEqual(output.budget_limit);
  expect(output.decision_log).toContainEqual(expect.objectContaining({
    tool_called: "add_to_cart",
    inputs: expect.objectContaining({ product_id: "classic-varsity-top" }),
    outputs: expect.objectContaining({ status: "failure", error: expect.stringContaining("exceed the shared budget") }),
  }));
  const substituteCalls = output.decision_log.filter((entry) => entry.tool_called === "find_substitutes");
  expect(substituteCalls.map((entry) => entry.inputs.max_price)).toEqual([60, 40]);
  expect(output.gap_report).toContainEqual(expect.objectContaining({ missing_attribute_or_category: "shirt" }));
});

test("formal gown gap names the closest product and viable catalog price", async () => {
  const output = await runFormalGapAgent();
  expect(output.items).toEqual([]);
  expect(output.decision_log.filter((entry) => entry.tool_called === "search_catalog")).toHaveLength(2);
  expect(output.decision_log[2].reasoning).toContain("1 changed filter");
  expect(output.gap_report).toEqual([expect.objectContaining({
    missing_attribute_or_category: "formal evening gown",
    recommendation: expect.stringMatching(/Blue Silk Tuxedo at \$70\.00.*formal evening gown.*\$60\.00/),
    min_viable_price: 60,
  })]);
});

test("waterproof zero-result search relaxes exactly one constraint then reports a gap", async () => {
  const output = await runWaterproofGapAgent();
  const searches = output.decision_log.filter((entry) => entry.tool_called === "search_catalog");
  expect(searches).toHaveLength(2);
  expect(searches[1].reasoning).toContain("1 changed filter");
  expect(output.items).toEqual([]);
  expect(output.gap_report[0]).toMatchObject({ missing_attribute_or_category: "waterproof shirt", min_viable_price: 20 });
  expect(output.gap_report[0].recommendation).toContain("Catalog recommendation");
});
