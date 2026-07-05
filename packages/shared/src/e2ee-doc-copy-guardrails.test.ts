import { existsSync, readFileSync } from "node:fs";
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

/** Reads a maintainer doc from the monorepo root. */
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

  it("app-consistency checklist documents field-bound entity crypto", () => {
    const text = readRepoFile("docs/app-consistency-checklist.md");
    expect(text).toContain("buildFieldAAD");
    expect(text).toContain("encryptEntityField");
    expect(text).toContain("decryptEntityField");
    expect(text).toContain("e2ee-entity-columns");
  });

  it("app-consistency checklist documents open-first create and selected-entity resolution", () => {
    const text = readRepoFile("docs/app-consistency-checklist.md");
    expect(text).toContain("Open-first create");
    expect(text).toContain("useE2eeDashboardSelectedEntity");
    expect(text).toContain("isPendingDraft");
    expect(text).toContain("isPendingFolderDraft");
    expect(text).toContain("ownedUpdateMissingRow");
    expect(text).toMatch(/first save/i);
    expect(text).not.toContain("persist-on-open");
    expect(text).not.toMatch(/background `createWithId`/i);
  });

  it("sortable-items hook docs do not describe removeDraft as persist-failure-only rollback", () => {
    const text = readRepoFile(
      "packages/ui/src/hooks/use-encrypted-sortable-items.ts"
    );
    expect(text).not.toContain("rollback on persist failure");
    expect(text).toMatch(/Discard a local open-first draft/i);
  });

  it("security audit documents ENCRYPTION_VERSION = 2 only (no legacy wire v1 support)", () => {
    const text = readRepoFile("docs/security-audit-2026-06-13.md");
    expect(text).toContain("ENCRYPTION_VERSION = 2");
    expect(text).toContain("encryptEntityField");
    expect(text).not.toMatch(/supports encryption version 1/i);
    expect(text).not.toMatch(/migrate.*version 1/i);
  });
});
