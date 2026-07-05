import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

/** Maintainer docs that must not reference removed E2EE shims. */
const E2EE_DOC_PATHS = [
  "README.md",
  "packages/shared/README.md",
  "docs/app-consistency-checklist.md",
  "docs/security-audit-2026-06-13.md",
  "docs/security-review-runbook.md",
  "docs/quality-modernization-baseline.md",
  "apps/tasks/README.md",
  "apps/notes/README.md",
  "apps/contacts/README.md",
  "apps/links/README.md",
] as const;

/** Removed extension/shared shim paths — must not appear as live module references. */
const RETIRED_E2EE_MODULE_REFS = [
  /e2ee-privacy\.ts/i,
  /e2ee-data-select\.ts/i,
  /e2ee-privacy\.test\.ts/i,
  /e2ee-data-select\.test\.ts/i,
] as const;

/** Legacy record-level AAD helper — docs must not instruct using it (guard scripts may mention it). */
const RETIRED_BUILD_AAD_INSTRUCTION = /\bbuildAAD\s*\(/;

/**
 *
 */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("E2EE maintainer doc copy guardrails", () => {
  it.each(E2EE_DOC_PATHS)("%s exists on disk", (rel) => {
    expect(existsSync(join(repoRoot, rel)), rel).toBe(true);
  });

  it.each(E2EE_DOC_PATHS)(
    "%s does not reference removed E2EE shim modules",
    (rel) => {
      const text = readRepoFile(rel);
      for (const re of RETIRED_E2EE_MODULE_REFS) {
        expect(text, `${rel}: ${re.source}`).not.toMatch(re);
      }
    }
  );

  it("app-consistency checklist does not instruct buildAAD in entity crypto", () => {
    const text = readRepoFile("docs/app-consistency-checklist.md");
    expect(text).not.toMatch(RETIRED_BUILD_AAD_INSTRUCTION);
    expect(text).toContain("buildFieldAAD");
    expect(text).toContain("e2ee-entity-columns");
  });

  it("consistency scripts may mention buildAAD only as a forbidden legacy pattern", () => {
    const scriptPaths = readdirSync(join(repoRoot, "scripts"))
      .filter((name) => name.includes("e2ee") && name.endsWith(".mjs"))
      .map((name) => `scripts/${name}`);

    for (const rel of scriptPaths) {
      const text = readRepoFile(rel);
      if (!text.includes("buildAAD")) {
        continue;
      }
      expect(text, `${rel} must frame buildAAD as legacy/forbidden`).toMatch(
        /legacy|forbidden|instead of/i
      );
    }
  });
});
