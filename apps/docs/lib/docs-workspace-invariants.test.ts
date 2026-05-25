import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(libDir, "../components");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const workspacePath = join(componentsDir, "docx-editor-workspace.tsx");
const titleBarActionsPath = join(componentsDir, "docs-title-bar-actions.tsx");
const hideVendorMenuPath = join(
  libDir,
  "../hooks/use-hide-vendor-file-menu-items.ts"
);
const vaultSheetPath = join(componentsDir, "vault-documents-sheet.tsx");
const bridgePath = join(libDir, "../styles/docx-editor-helvety-bridge.css");

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
    expect(shell).not.toContain("DocsCommandBar");
    expect(shell).not.toContain("@helvety/ui/command-bar");
    expect(shell).not.toContain("CommandBar");
    expect(shell).toContain("documentName={documentDisplayName}");
    expect(shell).toContain("onDocumentNameChange={handleDocumentNameChange}");
    expect(shell).toContain(
      "onDownload={(buffer) => void handleDownload(buffer)}"
    );
    expect(shell).toContain("onDownloadFile=");
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

  it("title bar actions integrate with Eigenpal toolbar chrome", () => {
    const titleBarActions = readFileSync(titleBarActionsPath, "utf8");
    const workspace = readFileSync(workspacePath, "utf8");
    const bridge = readFileSync(bridgePath, "utf8");
    const hideVendorMenu = readFileSync(hideVendorMenuPath, "utf8");

    expect(titleBarActions).toContain("docs-title-bar-actions");
    expect(titleBarActions).toContain("showMyDocuments");
    expect(titleBarActions).toContain("onOpenMyDocuments");
    expect(titleBarActions).toContain("onDownload");
    expect(titleBarActions).toContain("docs-title-bar-action--vault");
    expect(workspace).toContain("renderTitleBarRight");
    expect(workspace).toContain("onSave={handleSave}");
    expect(workspace).toContain("documentName={documentName}");
    expect(workspace).toContain("useHideVendorFileMenuItems");
    expect(hideVendorMenu).toContain("isVendorFileOpenItem");
    expect(hideVendorMenu).toContain("isVendorFileSaveItem");
    expect(bridge).toContain(
      '[data-testid="title-bar"] [role="menubar"] > :last-child'
    );
    expect(bridge).toContain('input[type="file"][accept*="docx"]');
    expect(bridge).toContain(".docs-title-bar-actions");
    expect(bridge).toContain(".docs-title-bar-action--vault");
    expect(bridge).toContain('[role="menubar"] > div > button');
    expect(bridge).toContain("min-width: max-content");
    expect(bridge).not.toContain(
      '[data-testid="title-bar"] .flex.items-center.px-1 > :last-child'
    );
    expect(bridge).toContain("Layer 7: seamless toolbar stack");
    expect(bridge).toContain("Layer 8: overlay parity");

    const titleBarBorder = bridge.match(
      /\[data-testid="title-bar"\][\s\S]*?border-top: 1px solid hsl\(var\(--border\)\)/
    );
    const titleBarSideBorder = bridge.match(
      /\[data-testid="title-bar"\][\s\S]*?border-left: 1px solid hsl\(var\(--border\)\)/
    );
    const formattingBarBorder = bridge.match(
      /\[data-testid="formatting-bar"\][\s\S]*?border-left: 1px solid hsl\(var\(--border\)\)/
    );
    const editorToolbarNoSideBorder = bridge.match(
      /\[data-testid="editor-toolbar"\][\s\S]*?border-left: none/
    );

    expect(titleBarBorder).not.toBeNull();
    expect(titleBarSideBorder).not.toBeNull();
    expect(formattingBarBorder).not.toBeNull();
    expect(editorToolbarNoSideBorder).not.toBeNull();
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
