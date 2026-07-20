import { runInterviewAgent } from "./agent-test-fixture.js";

test("test_all_items_assembled", async () => {
  const output = await runInterviewAgent();
  expect(output.items).toHaveLength(3);
  expect(output.gap_report).toEqual([]);
  expect(output.decision_log.some((entry) => entry.reasoning.includes("safety limit"))).toBe(false);
});

test("test_each_item_has_unique_slot", async () => {
  const output = await runInterviewAgent();
  expect(new Set(output.items.map((item) => item.slot))).toEqual(new Set(["shirt", "outer layer", "bag"]));
  expect(output.items.every((item) => item.slot.trim().length > 0)).toBe(true);
});
