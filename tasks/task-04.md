# Substitution, Replanning, and Gap Reporting

## Schedule

Sunday, 4:00 PM to 6:00 PM (2 hours)

## Codex Model + Effort

GPT-5.6 Sol, medium effort

## Objective

Add stockout substitution, dependency-aware replanning, and actionable gap reporting to the cart agent.

## Background

Task 3 is complete and the agent handles the first demo scenario. Read all substitution and zero-result scenarios in specs/scenarios.gherkin before coding.

## Files

Modify:

- src/agent/agent.ts
- src/agent/gap-reporter.ts
- data/inventory-config.json

## Constraints

- Check inventory before committing selected items.
- On a stockout, call find_substitutes and record the original item, stockout, alternatives, selection, and replan.
- Recheck full-cart budget after every substitution.
- If a substitute exceeds budget, find a cheaper compatible alternative or replace a dependent item.
- Retry a zero-result query once with exactly one relaxed constraint before reporting a gap.
- A gap report includes missing category or attribute, closest available product and price, minimum viable budget, and a catalog recommendation.

## Acceptance Criteria

- The second demo scenario produces a complete replacement cart with substitution evidence.
- The decision log shows stockout, substitute, and post-swap budget calculation.
- The formal-evening-under-$60 scenario produces an actionable gap report and no invented cart.
- All three demo scenarios pass from the terminal.

## Test Plan

- Complete tests/test_substitution_replanning.ts.
- Exercise both stockout Gherkin scenarios and both zero-result scenarios.
- Confirm the final budget remains compliant or the gap names the blocking slot.

## Out of Scope

UI and edge cases not represented in the scenarios.
