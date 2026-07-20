# Task 09: README Completion and Inventory Config

> **Model:** Terra | **Effort:** Medium

---

Read `AGENTS.md`, `PRD.md`, and `tests/ACCEPTANCE_RESULTS.md`. Make the following changes.

## Change 1: Complete README.md Placeholders

Open `README.md`. Replace ONLY the placeholder sections. Do not rewrite existing content.

### Writing rules for all new text:
- No paragraphs longer than 3 sentences
- No em dashes
- No filler phrases ("it's worth noting," "in order to," "as mentioned above")
- Get to the point in the first sentence of every section
- Practitioner voice, not marketing

### "How Codex Was Used"

Replace the placeholder with concrete specifics. Write from the first person:

- Codex generated the full spec package (PRD, AGENTS.md, BDD scenarios, task backlog, test stubs) from a single planning prompt before any code was written.
- Each of the 8 implementation tasks was fed to Codex as a self-contained prompt with explicit acceptance criteria. This produced more reliable output than requesting the full application at once.
- Codex built the ReAct agent loop, all five tool schemas in function-calling format, the enrichment prompt with anti-hallucination constraints, and the complete Next.js UI including the side-by-side comparison.
- The commit history shows the iterative build: planning artifacts, tasks 1-2, agent core, UI, deployment, enhancements.
- Note that Codex Session IDs will be added manually by the builder.

### "What Works and What Doesn't"

Replace the "Works well" placeholder bullets. Pull results from ACCEPTANCE_RESULTS.md:

- Intent decomposition infers implicit constraints correctly
- Cart completeness: 3-item carts assembled without stopping early
- Substitution replanning works with budget rechecking
- Gap reporting produces actionable recommendations with closest available option and minimum viable budget
- Budget adherence holds across all tested scenarios
- Side-by-side comparison visually proves enrichment value

Keep "Known Limitations" as-is.

### "Related Work"

Replace placeholder with: "The enrichment module is a compressed version of [RIA (Retail Intelligence Agent)](https://github.com/ak-aibuilder/ria-mvp), a standalone catalog readiness tool. Post-hackathon, Forage will consume RIA's output through the EnrichmentProvider interface."

### "Demo Video"

Change to: "Demo video: [to be added after recording]"

### Clone URL

Replace `<repository-url>` with `https://github.com/ak-aibuilder/forage-demo.git`

### Add link to Production Optimization Roadmap

Under "Future Extensions," add: "See [Production Optimization Roadmap](docs/PRODUCTION_OPTIMIZATION_ROADMAP.md) for the path from $0.50 to $0.05 per cart."

## Change 2: Update Inventory Config

Open `data/inventory-config.json`. Add 2 more out-of-stock products. Check `data/enriched-index.json` for valid handles. Pick products the agent would likely select for a "business casual outfit for a job interview" goal, so the stockout scenario forces meaningful substitution chains.

Update to 3 out-of-stock products total. Verify all handles exist in the enriched index.

## Constraints

- Do not rewrite existing README content that is not a placeholder
- Do not modify any files in src/ or app/
- No em dashes
- No competitor references
- No prior employer names
- README must stay under 3 pages

## Acceptance Criteria

- All placeholder sections filled with concrete, specific content
- Clone URL is the actual repo URL
- inventory-config.json has 3 out-of-stock products with valid handles
- New README text follows the writing rules above
- README renders cleanly on GitHub

Save both files.
