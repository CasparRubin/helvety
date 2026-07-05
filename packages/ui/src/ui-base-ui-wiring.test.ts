import { accessSync, constants, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const uiPackageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(uiPackageRoot, "../..");

const ZONE_APPS = [
  "web",
  "auth",
  "store",
  "tasks",
  "contacts",
  "notes",
  "links",
  "pdf",
  "image-upscaler",
  "image-editor",
] as const;

const COLLAPSIBLE_LINK_PANELS = [
  ["tasks", "components/item-action-panel.tsx"],
  ["contacts", "components/contact-action-panel.tsx"],
  ["notes", "components/item-editor.tsx"],
] as const;

/** Reads a UTF-8 file from the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("Base UI shadcn wiring", () => {
  it("packages/ui depends on @base-ui/react only (no Radix or cmdk)", () => {
    const pkg = JSON.parse(readRepoFile("packages/ui/package.json")) as {
      dependencies: Record<string, string>;
      exports: Record<string, string>;
    };
    expect(pkg.dependencies["@base-ui/react"]).toBeDefined();
    expect(pkg.dependencies["radix-ui"]).toBeUndefined();
    expect(pkg.dependencies["cmdk"]).toBeUndefined();
    expect(pkg.exports["./command"]).toBeUndefined();
  });

  it("does not ship cmdk Command primitive", () => {
    expect(() =>
      accessSync(join(uiPackageRoot, "src/command.tsx"), constants.F_OK)
    ).toThrow();
  });

  it("entity-links-panel uses Popover + Input picker (not cmdk)", () => {
    const src = readRepoFile("packages/ui/src/entity-links-panel.tsx");
    expect(src).toContain("Popover");
    expect(src).toContain("<Input");
    expect(src).toContain("initialFocus={false}");
    expect(src).not.toContain("cmdk");
    expect(src).not.toContain("@helvety/ui/command");
    expect(src).not.toMatch(/\basChild\b/);
  });

  it("button primitive uses Base UI render props (no asChild)", () => {
    const src = readRepoFile("packages/ui/src/button.tsx");
    expect(src).not.toMatch(/\basChild\b/);
    expect(src).toContain("ButtonPrimitive");
  });

  it("shared navbar uses nativeButton={false} on link-styled menu buttons", () => {
    const src = readRepoFile("packages/ui/src/helvety-shell-navbar.tsx");
    expect(src).toContain("nativeButton={false}");
    expect(src).not.toMatch(/\basChild\b/);
  });

  it.each(ZONE_APPS)("apps/%s/components.json uses base-vega", (app) => {
    const componentsJson = JSON.parse(
      readRepoFile(`apps/${app}/components.json`)
    ) as { style: string };
    expect(componentsJson.style).toBe("base-vega");
  });

  it.each(COLLAPSIBLE_LINK_PANELS)(
    "apps/%s/%s uses Base UI collapsible open chevron selector",
    (app, relativePath) => {
      const src = readRepoFile(`apps/${app}/${relativePath}`);
      expect(src).toContain("group-data-panel-open:rotate-90");
      expect(src).not.toContain("group-data-[state=open]:rotate-90");
    }
  );

  it("extension popup shell tabs use data-active (not Radix state=active)", () => {
    const src = readRepoFile("packages/extension-chrome/src/popup-shell.ts");
    expect(src).toContain("data-active:");
    expect(src).not.toContain("data-[state=active]");
  });
});
