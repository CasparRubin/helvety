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
    expect(src).toContain("editorSessionKey={itemId}");
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
    expect(editorSrc).toContain("editorSessionKey={itemId}");
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

  it("e2ee-item-editor-shell statically imports Tiptap", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/e2ee-item-editor-shell.tsx"),
      "utf8"
    );
    expect(src).toContain('from "./tiptap-editor"');
    expect(src).not.toContain("next/dynamic");
    expect(src).toContain("TiptapEditor");
    expect(src).toContain("key={editorSessionKey}");
  });

  it("contacts contact-editor uses dynamic link panels (Tiptap via shared shell)", () => {
    const src = readAppFile("contacts", "components/contact-editor.tsx");
    expect(src).toContain("@helvety/ui/date-picker");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("NoteLinksPanel");
    expect(src).toContain("TaskLinksPanel");
    expect(src).toContain("LinkEntityLinksPanel");
    expect(src).toContain("E2eeRichTextItemEditorShell");
    expect(src).toContain("editorSessionKey={contactId}");
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

describe("E2EE dashboard editor wiring (Links pattern)", () => {
  it.each([
    [
      "tasks",
      "components/flat-tasks-dashboard.tsx",
      "ItemEditor",
      "selectedItem",
    ],
    [
      "notes",
      "components/flat-notes-dashboard.tsx",
      "ItemEditor",
      "selectedItem",
    ],
    [
      "contacts",
      "components/contacts-dashboard.tsx",
      "ContactEditor",
      "selectedContact",
    ],
  ] as const)(
    "apps/%s routes sheet saves through list hook update",
    (app, dashboardPath, editorComponent, selectedEntityVar) => {
      const src = readAppFile(app, dashboardPath);
      expect(src).toContain("onUpdate={(input) => update(");
      expect(src).not.toContain("onLocalPatch");
      expect(src).not.toContain("patchLocal");
      expect(src).toContain(selectedEntityVar);
      expect(src).toContain(`key={entityId}`);
      expect(src).toContain(`<${editorComponent}`);
      expect(src).toContain("onRemove={() => remove(");
      expect(src).toContain("onRefresh={refresh}");
    }
  );

  it("apps/links routes sheet saves through library updateLink", () => {
    const src = readAppFile("links", "components/links-dashboard.tsx");
    expect(src).toContain("onSave={(input) => library.updateLink(");
    expect(src).toMatch(/key=\{editingLink\.id\}/);
    expect(src).toContain("onRefresh={library.refresh}");
    expect(src).not.toContain("onLocalPatch");
    expect(src).not.toContain("patchLocal");
  });

  it.each([
    ["tasks", "components/item-editor.tsx"],
    ["notes", "components/item-editor.tsx"],
  ] as const)(
    "apps/%s sheet editor uses shared save helper",
    (app, editorPath) => {
      const src = readAppFile(app, editorPath);
      expect(src).toContain("onUpdate");
      expect(src).toContain("initialDescription");
      expect(src).toContain("useE2eeRichTextItemEditorSave");
      expect(src).toMatch(/setHasInitialized\(false\)/);
      expect(src).not.toMatch(/useItem\s*\(/);
    }
  );

  it("apps/contacts sheet editor uses list props and custom metadata save", () => {
    const src = readAppFile("contacts", "components/contact-editor.tsx");
    expect(src).toContain("onUpdate");
    expect(src).toContain("initialDescription={contact?.notes ?? null}");
    expect(src).toContain("serializeRichTextContent(notesContent)");
    expect(src).toMatch(/setHasInitialized\(false\)/);
    expect(src).not.toMatch(/useContact\s*\(/);
  });

  it("apps/contacts gates metadata fields until initialized", () => {
    const src = readAppFile("contacts", "components/contact-editor.tsx");
    expect(src).toContain("renderBeforeEditor={");
    expect(src).toMatch(/hasInitialized\s*\?\s*\(/);
  });

  it.each([
    ["tasks", "components/item-editor.tsx", "stage_id"],
    ["notes", "components/item-editor.tsx", "category_id"],
    ["contacts", "components/contact-editor.tsx", "category_id"],
  ] as const)(
    "apps/%s metadata mutations route through onUpdate prop",
    (app, editorPath, field) => {
      const src = readAppFile(app, editorPath);
      expect(src).toContain(`onUpdate({ ${field}:`);
      expect(src).not.toContain("patchLocal");
    }
  );

  it.each([
    ["tasks", "components/item-editor.tsx"],
    ["notes", "components/item-editor.tsx"],
  ] as const)(
    "apps/%s item-editor passes initialDescription snapshot not live TipTap content",
    (app, editorPath) => {
      const src = readAppFile(app, editorPath);
      expect(src).toContain("initialDescription={item?.description ?? null}");
      expect(src).not.toMatch(/content=\{item\?\.description/);
    }
  );

  it("e2ee-entity-detail-sheet does not remount children via body key", () => {
    const src = readFileSync(
      join(repoRoot, "packages/ui/src/e2ee-entity-detail-sheet.tsx"),
      "utf8"
    );
    expect(src).not.toMatch(/key=\{entityId/);
  });
});

describe("E2EE app README accuracy", () => {
  it.each(["tasks", "notes", "contacts"] as const)(
    "apps/%s README documents Links pattern sheet wiring",
    (app) => {
      const src = readFileSync(
        join(repoRoot, "apps", app, "README.md"),
        "utf8"
      );
      expect(src).toContain("Links pattern");
      expect(src).toContain("update` / `remove` / `refresh`");
      expect(src).toContain("does not use it");
      expect(src).not.toMatch(/onLocalPatch/);
    }
  );

  it("apps/links README documents Links pattern sheet wiring", () => {
    const src = readFileSync(join(repoRoot, "apps/links/README.md"), "utf8");
    expect(src).toContain("Links pattern");
    expect(src).toContain("library.updateLink");
  });

  it("packages/ui README documents mount-only TipTap and Links pattern", () => {
    const src = readFileSync(join(repoRoot, "packages/ui/README.md"), "utf8");
    expect(src).toContain("initialDescription");
    expect(src).toContain("editorSessionKey");
    expect(src).toContain("Links pattern");
    expect(src).toContain("not use it in sheet editors");
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
