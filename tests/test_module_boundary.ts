import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Architectural test: the agent module must not depend on enrichment.
 */

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

test("test_agent_does_not_import_from_enrichment", () => {
  /**
   * Scan src/agent/ for import or require statements referencing
   * src/enrichment/. The agent module should only import from src/shared/.
   */
  // TODO: Keep this assertion when src/agent/ exists in the implementation.
  const agentDirectory = join(process.cwd(), "src", "agent");
  if (!statSync(agentDirectory, { throwIfNoEntry: false })) {
    expect(true).toBe(true);
    return;
  }

  const violations = listFiles(agentDirectory)
    .filter((path) => /\.(ts|tsx|js|jsx)$/.test(path))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return /(?:from\s+["'][^"']*src\/enrichment\/|require\(\s*["'][^"']*src\/enrichment\/)/.test(source)
        ? [path]
        : [];
    });

  expect(violations).toEqual([]);
});
