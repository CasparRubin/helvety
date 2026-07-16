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

  it("app-consistency checklist documents save-first create and selected-entity resolution", () => {
    const text = readRepoFile("docs/app-consistency-checklist.md");
    expect(text).toContain("Save-first create");
    expect(text).toContain("useE2eeDashboardSelectedEntity");
    expect(text).toContain("e2ee-create-inputs");
    expect(text).toContain("ownedUpdateMissingRow");
    expect(text).toMatch(/first save/i);
    expect(text).toMatch(/label_id.*null|null.*label_id/i);
    expect(text).not.toContain("persist-on-open");
    expect(text).not.toContain("isPendingDraft");
  });

  it("sortable-items hook docs describe save-first create", () => {
    const text = readRepoFile(
      "packages/ui/src/hooks/use-encrypted-sortable-items.ts"
    );
    expect(text).toMatch(/Save-first create/i);
    expect(text).not.toContain("seedDraft");
    expect(text).not.toContain("removeDraft");
  });

  it("e2ee-create-inputs form defaults do not embed DB label sentinel", () => {
    const text = readRepoFile("packages/shared/src/e2ee-create-inputs.ts");
    expect(text).toContain("label_id: null");
    expect(text).not.toMatch(/label_id:\s*DEFAULT_TASK_LABEL_ID/);
  });

  it("shared README documents structural payload merge helper", () => {
    const text = readRepoFile("packages/shared/README.md");
    expect(text).toContain("e2ee-structural-payload");
    expect(text).toContain("pickDefinedStructuralFields");
  });

  it("shared README and quality baseline list contacts web for validate-e2ee-draft", () => {
    const sharedReadme = readRepoFile("packages/shared/README.md");
    expect(sharedReadme).toContain("validate-e2ee-draft");
    expect(sharedReadme).toMatch(
      /contacts web.*ContactEditor|ContactEditor.*contacts/i
    );

    const baseline = readRepoFile("docs/quality-modernization-baseline.md");
    expect(baseline).toContain("validate-e2ee-draft");
    expect(baseline).toMatch(/Contacts web `ContactEditor`/);
  });

  it("app-consistency checklist documents create placeholder ISO timestamps and draft validation", () => {
    const text = readRepoFile("docs/app-consistency-checklist.md");
    expect(text).toContain("formatDateTime");
    expect(text).toMatch(/ISO timestamps/i);
    expect(text).toContain("validate-e2ee-draft");
    expect(text).toContain("pickDefinedStructuralFields");
  });

  it("e2ee-draft no longer exports open-first snapshot helpers", () => {
    const text = readRepoFile("packages/shared/src/e2ee-draft.ts");
    expect(text).toContain("getE2eeListTitle");
    expect(text).not.toContain("isDraftSnapshotUnchanged");
  });

  it.each([
    "apps/tasks/README.md",
    "apps/notes/README.md",
    "apps/contacts/README.md",
    "apps/links/README.md",
  ] as const)("%s documents save-first create, not persist-on-open", (rel) => {
    const text = readRepoFile(rel);
    expect(text).toMatch(/save-first/i);
    expect(text).toMatch(/first save|insert on first save/i);
    expect(text).toContain("e2ee-create-inputs");
    expect(text).not.toMatch(/persist-on-open/i);
    expect(text).not.toMatch(/draft row/i);
    expect(text).not.toMatch(/persists in the background/i);
  });

  it("packages/ui README documents structural payload merge for list hooks", () => {
    const text = readRepoFile("packages/ui/README.md");
    expect(text).toContain("e2ee-structural-payload");
    expect(text).toContain("pickDefinedStructuralFields");
  });

  it.each([
    "apps/tasks/public/llms.txt",
    "apps/contacts/public/llms.txt",
    "apps/notes/public/llms.txt",
    "apps/links/public/llms.txt",
  ] as const)(
    "%s documents save-first create, not draft-row persist-on-open",
    (rel) => {
      const text = readRepoFile(rel);
      expect(text).toMatch(/save-first/i);
      expect(text).not.toMatch(/draft row/i);
      expect(text).not.toMatch(/persist-on-open/i);
      expect(text).not.toMatch(/closing without edits removes/i);
    }
  );

  it("security audit documents ENCRYPTION_VERSION = 2 only (no legacy wire v1 support)", () => {
    const text = readRepoFile("docs/security-audit-2026-06-13.md");
    expect(text).toContain("ENCRYPTION_VERSION = 2");
    expect(text).toContain("encryptEntityField");
    expect(text).not.toMatch(/supports encryption version 1/i);
    expect(text).not.toMatch(/migrate.*version 1/i);
  });
});
