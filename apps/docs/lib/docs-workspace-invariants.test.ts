import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(libDir, "../components");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const workspacePath = join(componentsDir, "docx-editor-workspace.tsx");
const vaultPanelPath = join(componentsDir, "vault-panel.tsx");

/**
 * High-value source invariants for Docs editor UX (blank-on-load, remount, vault UX).
 * Behavioral coverage: `helvety-docs-shell.test.tsx`, `docx-editor-workspace.test.tsx`.
 * Theme bridge coverage: `docx-editor-theme.test.ts`.
 */
describe("docs workspace UX invariants", () => {
  it("blank editor uses createEmptyDocument and sessionKey remount", () => {
    const workspace = readFileSync(workspacePath, "utf8");
    const shell = readFileSync(shellPath, "utf8");

    expect(workspace).toContain("createEmptyDocument");
    expect(workspace).toContain("document: blankDocument");
    expect(workspace).toContain("documentBuffer !== null");
    expect(workspace).not.toContain("@eigenpal/docx-editor-react/styles.css");
    expect(shell).toContain("editorSessionKey");
    expect(shell).toContain("bumpEditorSession");
    expect(shell).toMatch(/handleNewDocument[\s\S]*?bumpEditorSession\(\)/);
    expect(shell).toMatch(/handleFileChange[\s\S]*?bumpEditorSession\(\)/);
    expect(shell).toMatch(
      /handleOpenVaultDocument[\s\S]*?bumpEditorSession\(\)/
    );
    expect(shell).toMatch(
      /handleDeleteVaultDocument[\s\S]*?handleNewDocument\(\)/
    );
    expect(shell).toContain("sessionKey={editorSessionKey}");
    expect(shell).toContain("hasDocument={true}");
  });

  it("vault list uses shared list states and delete confirmation", () => {
    const src = readFileSync(vaultPanelPath, "utf8");

    expect(src).toContain("ListLoadingState");
    expect(src).toContain("ListEmptyState");
    expect(src).toContain("AlertDialog");
    expect(src).toContain("Delete document");
  });

  it("docs shell and vault hook use E2EE error reporting helpers", () => {
    const shell = readFileSync(shellPath, "utf8");
    const useDocs = readFileSync(join(libDir, "../hooks/use-docs.ts"), "utf8");

    expect(shell).toContain("TOAST_DURATIONS");
    expect(useDocs).toContain("TOAST_DURATIONS");
    expect(useDocs).toContain("reportE2eeActionFailure");
    expect(useDocs).toContain("reportE2eeHookError");
  });

  it("does not auto-open vault documents from ?doc= on load", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).not.toContain("handleOpenVaultDocument(docId)");
    expect(src).toContain("initialDocIdRef");
    expect(src).toContain("strippedInitialDeepLinkRef");
    expect(src).toMatch(/Always start blank[\s\S]*?setDocInUrl\(null\)/);
  });
});
