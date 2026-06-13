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

/** Asserts cross-link panels appear in app-switcher order (Tasks → Contacts → Notes → Links). */
function expectCrossLinkPanelOrder(
  source: string,
  anchor: string,
  panels: readonly string[]
): void {
  const anchorIndex = source.indexOf(anchor);
  expect(anchorIndex).toBeGreaterThanOrEqual(0);
  let previousIndex = anchorIndex;
  for (const panel of panels) {
    const panelIndex = source.indexOf(panel, previousIndex + 1);
    expect(panelIndex).toBeGreaterThan(previousIndex);
    previousIndex = panelIndex;
  }
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

  it("keeps a flex height chain on the sheet body wrapper for CommandBarPageLayout scroll", () => {
    expect(sheetShellSrc).toContain("SHEET_SCROLLABLE_BODY_CLASS");
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

describe("E2EE cross-link panel hooks", () => {
  it.each([
    ["notes", "hooks/use-contact-links.ts"],
    ["notes", "hooks/use-task-links.ts"],
    ["notes", "hooks/use-link-entity-links.ts"],
    ["contacts", "hooks/use-note-links.ts"],
    ["contacts", "hooks/use-task-links.ts"],
    ["contacts", "hooks/use-link-entity-links.ts"],
    ["tasks", "hooks/use-note-links.ts"],
    ["tasks", "hooks/use-contact-links.ts"],
    ["tasks", "hooks/use-link-entity-links.ts"],
    ["links", "hooks/use-note-links.ts"],
    ["links", "hooks/use-task-links.ts"],
    ["links", "hooks/use-contact-links.ts"],
  ] as const)(
    "apps/%s/%s uses createE2eeEntityLinksHook factory",
    (app, hookPath) => {
      const src = readAppFile(app, hookPath);
      expect(src).toContain("createE2eeEntityLinksHook");
    }
  );

  it("createE2eeEntityLinksHook enforces guardE2eeMasterKey and CSRF", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/create-e2ee-entity-links-hook.ts"),
      "utf8"
    );
    expect(src).toContain("guardE2eeMasterKey");
    expect(src).toContain("useCSRFToken");
  });

  it("EntityLinksPanel loads catalog when Add picker opens", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/entity-links-panel.tsx"),
      "utf8"
    );
    expect(src).toContain("isPickerOpen");
    expect(src).toMatch(/isOpen\s*\|\|\s*isPickerOpen/);
  });

  it.each([
    ["contacts", "components/task-links-panel.tsx"],
    ["contacts", "components/note-links-panel.tsx"],
    ["contacts", "components/link-entity-links-panel.tsx"],
    ["notes", "components/task-links-panel.tsx"],
    ["notes", "components/contact-links-panel.tsx"],
    ["notes", "components/link-entity-links-panel.tsx"],
    ["tasks", "components/contact-links-panel.tsx"],
    ["tasks", "components/note-links-panel.tsx"],
    ["tasks", "components/link-entity-links-panel.tsx"],
    ["links", "components/note-links-panel.tsx"],
    ["links", "components/task-links-panel.tsx"],
    ["links", "components/contact-links-panel.tsx"],
  ] as const)("apps/%s/%s uses EntityLinksPanel", (app, panelPath) => {
    const src = readAppFile(app, panelPath);
    expect(src).toContain("EntityLinksPanel");
    expect(src).toContain("@helvety/ui/entity-links-panel");
    expect(src).toContain("E2EE_APP_LINK_UI");
  });

  it.each([
    ["tasks", "app/actions/link-entity-link-actions.ts"],
    ["notes", "app/actions/link-entity-link-actions.ts"],
    ["contacts", "app/actions/link-entity-link-actions.ts"],
    ["links", "app/actions/note-link-actions.ts"],
    ["links", "app/actions/task-link-actions.ts"],
    ["links", "app/actions/contact-link-actions.ts"],
  ] as const)(
    "apps/%s/%s exports bookmark cross-link actions",
    (app, actionPath) => {
      const src = readAppFile(app, actionPath);
      expect(src).toContain("createCanonicalLink");
      expect(src).toContain('"links"');
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
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("ContactLinksPanel");
    expect(src).toContain("TaskLinksPanel");
    expect(src).toContain("LinkEntityLinksPanel");
    expectCrossLinkPanelOrder(src, "renderLinks", [
      "<TaskLinksPanel",
      "<ContactLinksPanel",
      "<LinkEntityLinksPanel",
    ]);
  });

  it("tasks item-editor composes the shared shell and client-only link panels", () => {
    const panelSrc = readAppFile("tasks", "components/item-action-panel.tsx");
    expect(panelSrc).toContain("@helvety/ui/date-time-picker");

    const editorSrc = readAppFile("tasks", "components/item-editor.tsx");
    expect(editorSrc).toContain("E2eeRichTextItemEditorShell");
    expect(countSsrFalse(editorSrc)).toBeGreaterThanOrEqual(3);
    expect(editorSrc).toContain("ContactLinksPanel");
    expect(editorSrc).toContain("NoteLinksPanel");
    expect(editorSrc).toContain("LinkEntityLinksPanel");
    expectCrossLinkPanelOrder(editorSrc, "renderLinks", [
      "<ContactLinksPanel",
      "<NoteLinksPanel",
      "<LinkEntityLinksPanel",
    ]);
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
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("NoteLinksPanel");
    expect(src).toContain("TaskLinksPanel");
    expect(src).toContain("LinkEntityLinksPanel");
    expect(src).toContain("E2eeRichTextItemEditorShell");
    expectCrossLinkPanelOrder(src, "renderLinks", [
      "<TaskLinksPanel",
      "<NoteLinksPanel",
      "<LinkEntityLinksPanel",
    ]);
  });

  it("links link-editor uses dynamic cross-app link panels", () => {
    const src = readAppFile("links", "components/link-editor.tsx");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("NoteLinksPanel");
    expect(src).toContain("TaskLinksPanel");
    expect(src).toContain("ContactLinksPanel");
    expectCrossLinkPanelOrder(src, "mb-6 space-y-6", [
      "<TaskLinksPanel",
      "<ContactLinksPanel",
      "<NoteLinksPanel",
    ]);
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
