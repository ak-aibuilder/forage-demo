/**
 * Eval: Intent decomposition.
 * Scoring: 0-5 per PRD.md. Threshold for this stub: >= 3.
 */

test("test_explicit_constraints_extracted", () => {
  /**
   * Given "business casual outfit for a job interview, budget $150",
   * expect the first decision-log entry to contain explicit budget = $150
   * and the multi-item outfit requirement.
   */
  // TODO: Invoke the cart agent and assert the explicit constraints.
  expect(true).toBe(true);
});

test("test_implicit_constraints_inferred", () => {
  /**
   * Expect the decision log to infer professional but not formal, polished,
   * and likely neutral colors from the same shopping goal.
   */
  // TODO: Assert the inferred constraints and their decision-log entry.
  expect(true).toBe(true);
});
