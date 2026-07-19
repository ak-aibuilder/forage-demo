# UI

## Codex Model + Effort

GPT-5.6 Terra, medium effort

## Objective

Build a clear laptop-first interface for a shopping goal, composed cart, expandable decision log, gap report, and loading or error states.

## Background

Tasks 1 through 4 are complete and all three demo scenarios work from the terminal. Keep the UI focused on making the agent's reasoning observable.

## Files

Create:

- src/ui/page.tsx
- src/ui/components/goal-input.tsx
- src/ui/components/cart-display.tsx
- src/ui/components/decision-log.tsx
- src/ui/components/gap-report.tsx
- src/ui/components/loading.tsx
- an API route or server action connecting the UI to the agent

## Constraints

- Use clean typography and a clear layout. Functional clarity takes priority over visual decoration.
- Cart display includes item, price, justification, slot, total, budget limit, and remaining budget.
- Decision log is expandable and shows tool-call detail.
- Gap reports are visually distinct from successful carts.
- Show loading while the agent runs.
- Include graceful visible errors for API failures, empty results, and timeouts.
- Mobile optimization, dark mode, and animation are out of scope.

## Acceptance Criteria

- All three demo scenarios work through the UI.
- Cart, budget, justification, and decision-log details are visible.
- Formal-evening gap reporting is clear and actionable.
- Loading state appears while processing and resolves.
- No unhandled UI errors occur in tested paths.

## Test Plan

- Manually run each demo scenario through the UI.
- Check expanded and collapsed decision-log states.
- Simulate an agent error and confirm the error presentation.

## Out of Scope

Mobile optimization, dark mode, animations, and deployment.
