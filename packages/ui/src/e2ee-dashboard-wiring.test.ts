import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

/** Counts `ssr: false` occurrences (client-only dynamic imports in a source file). */
function countSsrFalse(source: string): number {
  return (source.match(/ssr:\s*false/g) ?? []).length;
}

describe("E2EE entity detail sheet shell", () => {
  const sheetShellSrc = readFileSync(
    join(repoRoot, "packages/ui/src/e2ee-entity-detail-sheet.tsx"),
    "utf8"
  );

  it("includes AccessibleSheetHeader with default and custom description support", () => {
    expect(sheetShellSrc).toContain("AccessibleSheetHeader");
    expect(sheetShellSrc).toContain("description ?? `Edit ${title}`");
  });

  it.each([
    ["notes", "components/flat-notes-dashboard.tsx"],
    ["tasks", "components/flat-tasks-dashboard.tsx"],
    ["contacts", "components/contacts-dashboard.tsx"],
    ["links", "components/links-dashboard.tsx"],
  ] as const)("apps/%s uses E2eeEntityDetailSheet", (app, dashboardPath) => {
    const src = readAppFile(app, dashboardPath);
    expect(src).toContain("E2eeEntityDetailSheet");
    expect(src).not.toMatch(/<SheetContent[^>]*side="right"/);
  });
});

describe("E2EE dashboard URL sync wiring", () => {
  it.each([
    ["notes", "components/flat-notes-dashboard.tsx"],
    ["tasks", "components/flat-tasks-dashboard.tsx"],
    ["contacts", "components/contacts-dashboard.tsx"],
  ] as const)("apps/%s uses shared URL sync hook", (app, dashboardPath) => {
    const src = readAppFile(app, dashboardPath);
    expect(src).toContain("useSyncE2eeEntityPanelFromUrl");
    expect(src).toContain("useE2eeEntityPanelWithUrl");
    expect(src).not.toContain("useSearchParams");
    expect(src).not.toMatch(
      /useEffect\([\s\S]*?searchParams[\s\S]*?closePanel\(\)/
    );
  });

  it("apps/links keeps guarded panelRef URL sync (dual ?link= / ?folder=)", () => {
    const src = readAppFile("links", "components/links-dashboard.tsx");
    expect(src).toContain("useLinksPanelUrlSync");
    expect(src).toContain("panelRef.current");
    expect(src).not.toContain("useSyncE2eeEntityPanelFromUrl");
  });
});

describe("E2EE page Suspense boundaries", () => {
  it.each(["notes", "tasks", "contacts", "links"] as const)(
    "apps/%s/page.tsx wraps dashboard in Suspense",
    (app) => {
      const src = readAppFile(app, "app/page.tsx");
      expect(src).toContain("Suspense");
      expect(src).toContain("ListLoadingState");
      expect(src).toContain("PrefetchedDashboard");
    }
  );
});

describe("E2EE hook documentation", () => {
  it("useE2eeEntityPanelWithUrl references useSyncE2eeEntityPanelFromUrl, not a raw dashboard useEffect", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/use-e2ee-entity-panel-with-url.ts"),
      "utf8"
    );
    expect(src).toContain("useSyncE2eeEntityPanelFromUrl");
    expect(src).not.toMatch(/Pair with a `useEffect`/);
  });
});

describe("E2EE editor dynamic import SSR", () => {
  it("notes item-editor composes the shared shell and client-only link panels", () => {
    const src = readAppFile("notes", "components/item-editor.tsx");
    expect(src).toContain("E2eeRichTextItemEditorShell");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(2);
    expect(src).toContain("ContactLinksPanel");
    expect(src).toContain("TaskLinksPanel");
  });

  it("tasks item-editor composes the shared shell and client-only link panels", () => {
    const panelSrc = readAppFile("tasks", "components/item-action-panel.tsx");
    expect(panelSrc).toContain("@helvety/ui/date-time-picker");

    const editorSrc = readAppFile("tasks", "components/item-editor.tsx");
    expect(editorSrc).toContain("E2eeRichTextItemEditorShell");
    expect(countSsrFalse(editorSrc)).toBeGreaterThanOrEqual(2);
    expect(editorSrc).toContain("ContactLinksPanel");
    expect(editorSrc).toContain("NoteLinksPanel");
  });

  it("e2ee-item-editor-shell client-only loads Tiptap", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/e2ee-item-editor-shell.tsx"),
      "utf8"
    );
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(1);
    expect(src).toContain("TiptapEditor");
  });

  it("contacts contact-editor uses dynamic link panels (Tiptap via shared shell)", () => {
    const src = readAppFile("contacts", "components/contact-editor.tsx");
    expect(src).toContain("@helvety/ui/date-picker");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(2);
    expect(src).toContain("NoteLinksPanel");
    expect(src).toContain("TaskLinksPanel");
    expect(src).toContain("E2eeRichTextItemEditorShell");
  });

  it("links dashboard uses dynamic sheet editors and no redundant locked empty state", () => {
    const src = readAppFile("links", "components/links-dashboard.tsx");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(2);
    expect(src).toContain("LinkEditor");
    expect(src).toContain("FolderEditor");
    expect(src).not.toContain('title="Locked"');
    expect(src).toContain("ListEmptySearchState");
  });
});

describe("E2EE navbar wiring", () => {
  it.each(["tasks", "notes", "contacts", "links"] as const)(
    "apps/%s navbar uses createE2eeAppNavbar factory",
    (app) => {
      const src = readAppFile(app, "components/navbar.tsx");
      expect(src).toContain("createE2eeAppNavbar");
    }
  );

  it("createE2eeAppNavbar wires E2EE encryption tooltip copy", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "create-app-navbar.tsx"),
      "utf8"
    );
    expect(src).toContain("E2EE_NAVBAR_ENCRYPTION_TOOLTIP");
    expect(src).toContain("E2eeAppNavbar");
  });
});
