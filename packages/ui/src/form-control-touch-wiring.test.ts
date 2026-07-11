import { accessSync, constants, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const uiPackageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(uiPackageRoot, "../..");
const extensionRoot = join(repoRoot, "../helvety-browser-extension-chromium");

/** Reads a UTF-8 file from `packages/ui`. */
function readUiFile(relativePath: string): string {
  return readFileSync(join(uiPackageRoot, relativePath), "utf8");
}

/** Reads a UTF-8 file from the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

/** Returns true when a sibling path exists (optional repos such as the extension). */
function siblingExists(relativePath: string): boolean {
  try {
    accessSync(join(repoRoot, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

describe("form control touch-safe wiring", () => {
  const formControlFiles = [
    "src/input.tsx",
    "src/textarea.tsx",
    "src/native-select.tsx",
    "src/tiptap-editor.tsx",
  ] as const;

  it.each(formControlFiles)(
    "%s imports shared form-control text size constants",
    (relativePath) => {
      const source = readUiFile(relativePath);
      expect(source).toContain('from "./form-control-text-size"');
      expect(source).toContain("FORM_CONTROL_");
    }
  );

  it("input.tsx no longer uses width-only md:text-sm breakpoint", () => {
    const source = readUiFile("src/input.tsx");
    expect(source).not.toContain("md:text-sm");
  });

  it("tiptap-editor uses touch-aware prose sizing instead of prose-sm only", () => {
    const source = readUiFile("src/tiptap-editor.tsx");
    expect(source).toContain("FORM_CONTROL_PROSE_SIZE_CLASS");
    expect(source).not.toMatch(/EDITOR_CONTENT_CLASS[\s\S]*"prose prose-sm/);
  });

  it("package.json exports touch CSS, constants, and Textarea", () => {
    const pkg = JSON.parse(readUiFile("package.json")) as {
      exports: Record<string, string>;
    };
    expect(pkg.exports["./form-control-touch.css"]).toBe(
      "./form-control-touch.css"
    );
    expect(pkg.exports["./form-control-text-size"]).toBe(
      "./src/form-control-text-size.ts"
    );
    expect(pkg.exports["./textarea"]).toBe("./src/textarea.tsx");
  });

  it("globals.css imports form-control-touch.css", () => {
    expect(readUiFile("globals.css")).toContain(
      '@import "./form-control-touch.css"'
    );
  });

  it("form-control-touch.css applies 16px on coarse pointer devices", () => {
    const touchCss = readUiFile("form-control-touch.css");
    expect(touchCss).toContain("(hover: none)");
    expect(touchCss).toContain("(pointer: coarse)");
    expect(touchCss).toContain("font-size: 1rem");
    expect(touchCss).toMatch(/input:not\(\[type="checkbox"\]/);
    expect(touchCss).toContain("select,");
    expect(touchCss).toContain("textarea,");
    expect(touchCss).toContain('[contenteditable="true"]');
  });

  it.each([
    "apps/web/app/globals.css",
    "apps/auth/app/globals.css",
    "apps/store/app/globals.css",
    "apps/tasks/app/globals.css",
    "apps/contacts/app/globals.css",
    "apps/notes/app/globals.css",
    "apps/links/app/globals.css",
    "apps/pdf/app/globals.css",
    "apps/image-upscaler/app/globals.css",
    "apps/image-editor/app/globals.css",
    "apps/ocr/app/globals.css",
  ] as const)("zone %s imports shared ui globals (touch CSS chain)", (path) => {
    expect(readRepoFile(path)).toContain('@import "@helvety/ui/globals.css"');
  });

  it.each([
    "apps/image-upscaler/components/helvety-image-upscaler.tsx",
    "apps/image-upscaler/components/image-upscaler-command-bar.tsx",
    "apps/pdf/components/pdf/pdf-toolkit.tsx",
    "apps/links/components/link-form-fields.tsx",
    "apps/links/components/folder-editor.tsx",
  ] as const)("%s uses NativeSelect instead of raw select markup", (path) => {
    const source = readRepoFile(path);
    expect(source).toContain("@helvety/ui/native-select");
    expect(source).toContain("NativeSelect");
    expect(source).not.toMatch(/<select[\s/>]/);
  });

  it("consistency guardrails enforce shared form controls", () => {
    const guardrails = readRepoFile("scripts/check-consistency-guardrails.mjs");
    expect(guardrails).toContain("uses raw <select>");
    expect(guardrails).toContain("uses raw <textarea>");
    expect(guardrails).toContain("@helvety/ui/globals.css");
    expect(guardrails).toContain("@helvety/ui/form-control-touch.css");
    expect(guardrails).toContain("components/Textarea.tsx must be removed");
  });

  it("ui-shadcn integration policy documents the single touch-safe form system", () => {
    const policy = readRepoFile("docs/ui-shadcn-integration-policy.md");
    expect(policy).toContain("## Mobile form controls");
    expect(policy).toContain("@helvety/ui/form-control-touch.css");
    expect(policy).toContain("@helvety/ui/textarea");
  });

  it("entity-links-panel search picker uses shared Input (not cmdk Command)", () => {
    const src = readUiFile("src/entity-links-panel.tsx");
    expect(src).toContain("<Input");
    expect(src).not.toContain("cmdk");
    expect(src).not.toContain("CommandInput");
  });
});

describe("browser extension touch-safe wiring", () => {
  it("extension globals.css imports shared ui globals (touch CSS chain)", () => {
    if (
      !siblingExists("../helvety-browser-extension-chromium/src/globals.css")
    ) {
      return;
    }
    const extensionGlobals = readFileSync(
      join(extensionRoot, "src/globals.css"),
      "utf8"
    );
    expect(
      extensionGlobals.includes('@import "@helvety/ui/globals.css"') ||
        extensionGlobals.includes(
          '@import "@helvety/ui/form-control-touch.css"'
        )
    ).toBe(true);
  });

  it("extension entity forms use @helvety/ui/textarea (no local component)", () => {
    if (
      !siblingExists(
        "../helvety-browser-extension-chromium/src/popup/views/EntityFormView.tsx"
      )
    ) {
      return;
    }
    const entityForm = readFileSync(
      join(extensionRoot, "src/popup/views/EntityFormView.tsx"),
      "utf8"
    );
    expect(entityForm).toContain("@helvety/ui/textarea");
    expect(entityForm).not.toContain("../components/Textarea");
    expect(() =>
      accessSync(
        join(extensionRoot, "src/popup/components/Textarea.tsx"),
        constants.F_OK
      )
    ).toThrow();
  });
});
