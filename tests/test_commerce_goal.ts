import { isCommerceGoal } from "../src/shared/commerce-goal.js";

describe("isCommerceGoal", () => {
  test.each([
    "what's the weather today",
    "tell me a joke",
    "cricket match updates",
    "who is the president",
    "",
  ])("rejects off-topic input: %s", (goal) => {
    expect(isCommerceGoal(goal)).toBe(false);
  });

  test.each([
    "business casual outfit for a job interview, budget $150",
    "I need a jacket",
    "gift for my girlfriend",
    "something warm for winter under $100",
    "black pants",
    "I need something nice to wear",
  ])("accepts a shopping goal: %s", (goal) => {
    expect(isCommerceGoal(goal)).toBe(true);
  });
});
