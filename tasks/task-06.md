# Edge Cases, Error Handling, and Final Testing

## Codex Model + Effort

GPT-5.6 Sol, medium effort

## Objective

Harden enrichment, agent, and UI error handling, then run final acceptance tests across all scenarios and PRD evals.

## Background

Tasks 1 through 5 are complete and the three demo scenarios work through the UI. Use PRD.md eval thresholds and specs/scenarios.gherkin as the acceptance contract.

## Files

Modify as needed:

- src/enrichment/enricher.ts
- src/agent/agent.ts
- src/ui/components/
- tests/
- files with failures found during verification

## Constraints

- Handle missing descriptions with title-only, low-confidence enrichment.
- For budget too low for any item, explain the minimum viable cost.
- Retry zero-result searches once with exactly one relaxed constraint.
- Surface API errors and timeouts without crashing the UI.
- Enforce the 15-call cap and return partial results with an explanation.
- Preserve source-data immutability, module separation, hard budgets, decision logging, and no-hallucinated-product rules.
- Keep traces redacted and include request ID, prompt version, model, tool calls, retries, latency, errors, and token usage.

## Acceptance Criteria

- Title-only enrichment produces low-confidence flags.
- A $10 budget produces a clear minimum-cost explanation.
- A nonsensical product request produces a gap report after one relaxed retry.
- API errors are visible in the UI without a crash.
- The iteration cap prevents an infinite tool loop.
- All three demo scenarios and four PRD evals still meet their thresholds.
- No unhandled exceptions occur in any tested path.

## Test Plan

- Complete and run all files in tests/.
- Run the eight Gherkin scenarios and record results.
- Run all three demos through CLI and UI.
- Test $10 budget and "purple elephant tuxedo for Mars".
- Inspect traces for complete, redacted tool records.

## Out of Scope

Deployment, demo video production, and final README updates.
