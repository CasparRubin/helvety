import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a UTF-8 source file from the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("scrollable sheet wiring", () => {
  it.each([
    ["packages/ui/src/app-switcher.tsx", "SHEET_SCROLLABLE_SHELL_CLASS"],
    [
      "packages/ui/src/helvety-shell-navbar.tsx",
      "SHEET_SCROLLABLE_SHELL_CLASS",
    ],
    [
      "apps/docs/components/vault-documents-sheet.tsx",
      "SHEET_SCROLLABLE_SHELL_CLASS",
    ],
    [
      "packages/ui/src/e2ee-entity-detail-sheet.tsx",
      "SHEET_SCROLLABLE_BODY_CLASS",
    ],
  ] as const)(" %s uses %s", (relativePath, token) => {
    expect(readRepoFile(relativePath)).toContain(token);
  });

  it("list-style sheets scroll body content in ScrollArea with min-h-0 flex-1", () => {
    for (const relativePath of [
      "packages/ui/src/app-switcher.tsx",
      "packages/ui/src/helvety-shell-navbar.tsx",
      "apps/docs/components/vault-documents-sheet.tsx",
    ]) {
      const src = readRepoFile(relativePath);
      expect(src).toContain("ScrollArea");
      expect(src).toContain("min-h-0 flex-1");
    }
  });

  it("entity editors use flex-filling loading placeholders in the sheet body chain", () => {
    const loadingClass = "flex min-h-0 flex-1 items-center justify-center";
    for (const [app, editor] of [
      ["notes", "item-editor.tsx"],
      ["tasks", "item-editor.tsx"],
      ["contacts", "contact-editor.tsx"],
    ] as const) {
      expect(readRepoFile(`apps/${app}/components/${editor}`)).toContain(
        loadingClass
      );
    }
    expect(
      readRepoFile("packages/ui/src/e2ee-item-editor-shell.tsx")
    ).toContain(loadingClass);
  });

  it("link and folder editors keep CommandBarPageLayout in the sheet scroll chain", () => {
    for (const editor of ["link-editor.tsx", "folder-editor.tsx"] as const) {
      const src = readRepoFile(`apps/links/components/${editor}`);
      expect(src).toContain("CommandBarPageLayout");
      expect(src).toContain("min-h-0 flex-1");
    }
  });
});
