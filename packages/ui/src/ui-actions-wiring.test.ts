import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ICON_SIZE_CLASS } from "./icon-size";
import {
  PUBLIC_TOOL_CANVAS_SHELL_CLASS,
  PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
  PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
  PUBLIC_TOOL_SIDEBAR_WIDTH_PX_CLASS,
  PUBLIC_TOOL_WORKSPACE_ROW_CLASS,
} from "./public-tool-workspace";

const repoRoot = resolve(import.meta.dirname, "../../..");
const extensionChromeDir = resolve(repoRoot, "packages/extension-chrome");
const appsDir = resolve(repoRoot, "apps");
const extensionDir = resolve(
  repoRoot,
  "..",
  "helvety-browser-extension-chromium"
);

/**
 *
 */
function readAppFile(app: string, relativePath: string): string {
  return readFileSync(resolve(appsDir, app, relativePath), "utf8");
}

describe("ui action primitives", () => {
  it("exports icon size constants", () => {
    expect(ICON_SIZE_CLASS).toBe("size-4");
  });

  it("exports public-tool workspace constants", () => {
    expect(PUBLIC_TOOL_WORKSPACE_ROW_CLASS).toContain("lg:flex-row");
    expect(PUBLIC_TOOL_SIDEBAR_PANEL_CLASS).toContain("bg-surface-panel");
    expect(PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS).toContain("w-80");
    expect(PUBLIC_TOOL_SIDEBAR_WIDTH_PX_CLASS).toContain("w-[320px]");
    expect(PUBLIC_TOOL_CANVAS_SHELL_CLASS).toContain("bg-muted/30");
  });
});

describe("ui action app wiring", () => {
  it.each([
    ["tasks", "components/entity-row.tsx"],
    ["notes", "components/entity-row.tsx"],
    ["contacts", "components/contact-row.tsx"],
  ] as const)(
    "%s list row uses Trash2Icon and ICON_SIZE_CLASS",
    (app, file) => {
      const src = readAppFile(app, file);
      expect(src).toContain("Trash2Icon");
      expect(src).not.toContain("TrashIcon");
      expect(src).toContain("@helvety/ui/icon-size");
      expect(src).toContain("ICON_SIZE_CLASS");
    }
  );

  it("links tree list row actions use RowActionButton and ICON_SIZE_CLASS", () => {
    const src = readAppFile("links", "components/links-tree-list.tsx");
    expect(src).toContain("@helvety/ui/row-action-button");
    expect(src).toContain("@helvety/ui/icon-size");
    expect(src).toContain("function RowIconButton");
  });

  it("public tools import workspace constants", () => {
    expect(readAppFile("pdf", "components/helvety-pdf.tsx")).toContain(
      "@helvety/ui/public-tool-workspace"
    );
    const upscalerWorkspace = readAppFile(
      "image-upscaler",
      "components/helvety-image-upscaler.tsx"
    );
    expect(upscalerWorkspace).toContain("@helvety/ui/public-tool-workspace");
    expect(upscalerWorkspace).toContain("PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS");
    const ocrWorkspace = readAppFile("ocr", "components/helvety-ocr.tsx");
    expect(ocrWorkspace).toContain("@helvety/ui/public-tool-workspace");
    expect(ocrWorkspace).toContain("PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS");
    expect(readAppFile("pdf", "components/pdf/pdf-toolkit.tsx")).toContain(
      "PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS"
    );
    expect(
      readAppFile("image-editor", "components/layers-panel.tsx")
    ).toContain("PUBLIC_TOOL_SIDEBAR_PANEL_CLASS");
  });

  it("apps import toast from @helvety/ui/sonner", () => {
    const toastApps = [
      ["auth", "hooks/use-login-flow.ts"],
      ["links", "hooks/use-link-library.ts"],
      ["pdf", "hooks/use-error-handler.ts"],
      ["image-upscaler", "components/helvety-image-upscaler.tsx"],
    ] as const;

    for (const [app, file] of toastApps) {
      const src = readAppFile(app, file);
      expect(src).toContain("@helvety/ui/sonner");
      expect(src).not.toMatch(/from\s+["']sonner["']/);
    }
  });

  it("re-exports toast from sonner in @helvety/ui/sonner", () => {
    const sonnerSrc = readFileSync(
      resolve(import.meta.dirname, "sonner.tsx"),
      "utf8"
    );
    expect(sonnerSrc).toContain('export { toast } from "sonner"');
    expect(sonnerSrc).toContain("export { Toaster");
  });
});

describe("extension chrome scrollbar tokens", () => {
  it("uses OKLCH-compatible color-mix in popup.css", () => {
    const css = readFileSync(resolve(extensionChromeDir, "popup.css"), "utf8");
    expect(css).toContain("color-mix(in oklch");
    expect(css).not.toContain("hsl(var(--foreground)");
  });

  it("uses OKLCH extension-tokens.css", () => {
    const css = readFileSync(
      resolve(extensionChromeDir, "extension-tokens.css"),
      "utf8"
    );
    expect(css).toContain("oklch(");
    expect(css).not.toContain("352 78%");
  });

  it("extension globals import canonical token profile", () => {
    const globals = readFileSync(
      resolve(extensionDir, "src", "globals.css"),
      "utf8"
    );
    expect(globals).toContain("@helvety/extension-chrome/extension-tokens.css");
    expect(globals).not.toContain("./popup/extension-tokens.css");
  });
});
