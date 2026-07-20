# Task 06 Acceptance Results

Date: 2026-07-19

## Automated quality gates

| Gate | Result |
| --- | --- |
| `npm run build` | Pass |
| `npm test` | Pass, 39 tests across 10 suites |
| `npm run web:build` | Pass |
| `git diff --check` | Pass |
| Source CSV immutability | Pass, working tree and `HEAD` blob hashes both `0484abcdf9211b52db4a5beb00be6202369c8167` |

## Gherkin scenarios

| Scenario | Result |
| --- | --- |
| Search for a cotton shirt with only explicit constraints | Pass |
| Infer an interview outfit from an implicit shopping goal | Pass |
| Allocate a shared budget across three requested items | Pass |
| Replan when initially selected items would exceed the budget | Pass |
| Replace one out-of-stock item with an available substitute | Pass |
| Rebalance a cart when a substitute makes it exceed budget | Pass |
| Report a specific catalog gap for an impossible formal request | Pass |
| Retry one relaxed search after zero catalog results | Pass |

The executable mappings are in `tests/test_gherkin_acceptance.ts`.

## PRD evals

| Eval | Score | Threshold | Result |
| --- | ---: | ---: | --- |
| Intent decomposition | 5/5 | 4 | Pass |
| Cart completeness | 5/5 | 4 | Pass |
| Substitution and replanning | 5/5 | 4 | Pass |
| Budget adherence | 5/5 | 4 | Pass |

The executable scoring is in `tests/test_prd_evals.ts`.

## Live CLI validation

| Goal | Result |
| --- | --- |
| Business casual interview outfit, all products in stock, budget $150 | Pass, 3 items, $140 total, $10 remaining |
| Business casual interview outfit with simulated stockouts, budget $150 | Pass, replanned to 3 in-stock items, $130 total, $20 remaining |
| Formal evening gown under $60 | Pass, no invented item, one relaxed retry, specific gap and closest $70 option |
| Cotton shirt under $10 | Pass, no over-budget item, one relaxed retry, true $50 minimum viable catalog cost |
| Purple elephant tuxedo for Mars under $100 | Pass after hard-constraint enforcement, no approximation added, one relaxed retry, specific gap |

## Live UI validation

| Flow | Result |
| --- | --- |
| Complete outfit | Pass, 3 item cart, totals and 13-step decision log rendered |
| Stockout replan | Pass, substitute selected, full cart at $130, inventory, substitution, and budget recheck visible in 15 steps |
| Catalog gap | Pass, empty cart plus specific gap, closest option, and two search steps rendered |
| Isolated upstream failure | Pass, safe message, request ID, and retry button rendered without exposing the upstream error |

## Edge cases and trace inspection

- Title-only enrichment keeps inferred confidence scores below 0.5.
- Zero-result searches permit exactly one retry with exactly one changed filter.
- A 15-tool-call cap returns partial results and explains every unresolved slot.
- Hard product attributes block approximations that the model admits do not satisfy the request.
- API failures and timeouts map to actionable public errors; unknown upstream bodies are not exposed.
- Tool traces include request ID, prompt version, model, retry count, cumulative model latency, token usage, tool latency, status, and errors.
- Sensitive keys such as authorization, API keys, passwords, secrets, and tokens are recursively redacted from trace inputs and outputs.
