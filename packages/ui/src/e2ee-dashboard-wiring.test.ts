import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

/** Counts `ssr: false` occurrences (Tiptap + cross-link panels on notes/tasks editors). */
function countSsrFalse(source: string): number {
  return (source.match(/ssr:\s*false/g) ?? []).length;
}

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
  it("notes item-editor client-only loads Tiptap and cross-link panels", () => {
    const src = readAppFile("notes", "components/item-editor.tsx");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("ContactLinksPanel");
    expect(src).toContain("TaskLinksPanel");
  });

  it("tasks item-editor client-only loads Tiptap and cross-link panels", () => {
    const src = readAppFile("tasks", "components/item-editor.tsx");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(3);
    expect(src).toContain("ContactLinksPanel");
    expect(src).toContain("NoteLinksPanel");
  });

  it("contacts contact-editor client-only loads Tiptap only", () => {
    const src = readAppFile("contacts", "components/contact-editor.tsx");
    expect(countSsrFalse(src)).toBeGreaterThanOrEqual(1);
    expect(src).not.toContain("ContactLinksPanel");
  });
});
