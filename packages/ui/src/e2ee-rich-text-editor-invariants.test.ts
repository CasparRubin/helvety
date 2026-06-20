import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const uiSrc = join(dirname(fileURLToPath(import.meta.url)));
const repoRoot = join(uiSrc, "../../..");

/** Reads a UTF-8 source file from `packages/ui/src/`. */
function readUiSource(relativePath: string): string {
  return readFileSync(join(uiSrc, relativePath), "utf8");
}

/** Reads a UTF-8 source file from `apps/<app>/`. */
function readAppSource(app: string, relativePath: string): string {
  return readFileSync(join(repoRoot, "apps", app, relativePath), "utf8");
}

describe("E2EE rich-text editor invariants", () => {
  it("TiptapEditor avoids live content sync and option churn", () => {
    const source = readUiSource("tiptap-editor.tsx");
    expect(source).toContain("initialContentRef");
    expect(source).toContain("shouldRerenderOnTransaction: false");
    expect(source).toContain("useMemo");
    expect(source).toContain("useEditorState");
    expect(source).not.toMatch(
      /content:\s*content\s*\?\s*sanitizeRichTextJson\(content\)/
    );
  });

  it("E2eeRichTextItemEditorShell keys TipTap by editorSessionKey only", () => {
    const source = readUiSource("e2ee-item-editor-shell.tsx");
    expect(source).toContain("editorSessionKey: string");
    expect(source).toContain("key={editorSessionKey}");
    expect(source).toContain("titleInitializedRef");
    expect(source).toContain("loadedEditorSessionRef");
    expect(source).toContain("editorRef.current?.setContent");
    expect(source).not.toMatch(/key=\{value/);
    expect(source).not.toMatch(/key=\{description/);
  });

  it.each([
    ["tasks", "components/item-editor.tsx", "editorSessionKey={itemId}"],
    ["notes", "components/item-editor.tsx", "editorSessionKey={itemId}"],
    [
      "contacts",
      "components/contact-editor.tsx",
      "editorSessionKey={contactId}",
    ],
  ] as const)("apps/%s editor wires editorSessionKey", (app, file, needle) => {
    const source = readAppSource(app, file);
    expect(source).toContain("E2eeRichTextItemEditorShell");
    expect(source).toContain(needle);
  });
});
