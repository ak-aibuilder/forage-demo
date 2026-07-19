# Cart Agent ReAct Loop

## Codex Model + Effort

GPT-5.6 Sol, high effort

## Objective

Implement the tool-using cart agent that composes complete multi-item carts from a shopping goal.

## Background

Tasks 1 and 2 are complete. The enriched index and five controlled tools exist and are tested. Read AGENTS.md section 10 and the first four scenarios before coding.

## Files

Create:

- src/agent/agent.ts
- src/agent/decision-log.ts
- src/agent/gap-reporter.ts
- src/agent/index.ts
- scripts/run-agent.ts

## Constraints

- Use the system prompt in AGENTS.md section 10 without semantic changes.
- Use GPT-5.6 Sol function calling, not string parsing.
- Record explicit and implicit constraints before the first tool call.
- Call get_cart_summary after every add_to_cart call.
- Fulfill every requested slot before ending, unless a concrete gap is reported.
- Log each tool call with step, tool, input, output, and reasoning.
- Cap the agent at 15 tool calls and return a clear partial-result explanation on exhaustion.
- Preserve the agent-to-enrichment module boundary.

## Acceptance Criteria

- The interview-outfit scenario returns a complete multi-item cart from the CLI.
- The first decision-log entry contains the inferred professional, polished, non-formal constraints.
- Every tool call is represented in the decision log.
- Budget math is correct across all selected items.
- The agent exits only after cart completion or a gap report.

## Test Plan

- Run scripts/run-agent.ts with the interview goal and $150 budget.
- Complete assertions in test_intent_decomposition.ts, test_cart_completeness.ts, and test_budget_adherence.ts.
- Compare the output with the relevant Gherkin scenarios.

## Out of Scope

Stockout replanning, UI, and advanced edge-case handling.
