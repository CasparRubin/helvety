import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(libDir, "../components");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const workspacePath = join(componentsDir, "docx-editor-workspace.tsx");
const commandBarPath = join(componentsDir, "docs-command-bar.tsx");
const vaultSheetPath = join(componentsDir, "vault-documents-sheet.tsx");

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
    expect(shell).toContain("VaultDocumentsSheet");
    expect(shell).not.toContain("VaultPanel");
    expect(shell).toMatch(
      /handleOpenVaultDocument[\s\S]*?setVaultSheetOpen\(false\)/
    );
    expect(shell).toContain(
      "onOpenMyDocuments={() => setVaultSheetOpen(true)}"
    );
  });

  it("editor disables comment UI via controlled empty comments", () => {
    const workspace = readFileSync(workspacePath, "utf8");

    expect(workspace).toContain("comments={[]}");
    expect(workspace).toContain("onCommentsChange={noopCommentsChange}");
    expect(workspace).toMatch(/comment UI suppressed/i);
  });

  it("command bar stacks flush with Eigenpal toolbar chrome", () => {
    const commandBar = readFileSync(commandBarPath, "utf8");

    expect(commandBar).toContain('className="border-b-0"');
    expect(commandBar).toContain("showMyDocuments");
    expect(commandBar).toContain("onOpenMyDocuments");
  });

  it("vault list uses shared list states and delete confirmation", () => {
    const src = readFileSync(vaultSheetPath, "utf8");

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
