import { runInterviewAgent } from "./agent-test-fixture.js";

test("test_explicit_constraints_extracted", async () => {
  const output = await runInterviewAgent();
  const firstEntry = output.decision_log[0];
  expect(firstEntry.tool_called).toBeNull();
  expect(firstEntry.outputs.explicit_constraints).toEqual(expect.arrayContaining(["$150 maximum", "business casual", "job interview", "multi-item outfit"]));
  expect(firstEntry.outputs.required_slots).toEqual(["shirt", "outer layer", "bag"]);
});

test("test_implicit_constraints_inferred", async () => {
  const output = await runInterviewAgent();
  expect(output.decision_log[0].outputs.implicit_constraints).toEqual(expect.arrayContaining(["professional", "polished", "non-formal", "neutral styling"]));
  expect(output.decision_log.slice(1).every((entry) => entry.tool_called !== null)).toBe(true);
});
