const COMMERCE_SIGNAL = /\b(?:buy|outfit|wear|clothes?|shirt|jacket|pants?|shoes?|jewelry|gift|accessor(?:y|ies)|dress|formal|casual|budget|under|style|look|wardrobe|shopping|find|need|get|match|set|dollar|spend|interview|wedding|party|date|work|weekend|dinner|trip|meeting)\b|\$/i;
const OFF_TOPIC_SIGNAL = /\b(?:weather|joke|cricket|president)\b/i;

/** Returns true only when a goal has a clear apparel-shopping signal. */
export function isCommerceGoal(goal: string): boolean {
  const normalizedGoal = goal.trim();
  return normalizedGoal.length > 0 && !OFF_TOPIC_SIGNAL.test(normalizedGoal) && COMMERCE_SIGNAL.test(normalizedGoal);
}
