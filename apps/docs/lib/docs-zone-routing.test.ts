import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(libDir, "../components");
const hooksDir = join(libDir, "../hooks");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const vaultSheetPath = join(componentsDir, "vault-documents-sheet.tsx");
const shellSrc = () => readFileSync(shellPath, "utf8");
const useDocsPath = join(hooksDir, "use-docs.ts");

/**
 * Docs uses Next basePath `/docs`. Client router paths must stay zone-relative;
 * fetch/auth redirects must use gateway-visible `/docs…` via docs-zone-path helpers.
 */
describe("docs zone routing invariants", () => {
  it("shell navigates via setDocInUrl only (no /docs router.replace double prefix)", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).not.toMatch(/router\.replace\(["'`]\/docs/);
    expect(src).toContain("usePathname");
    expect(src).toContain("setDocInUrl");
    expect(src).toContain("currentDoc === docId");
    expect(src).toContain("scroll: false");
  });

  it("clears ?doc= on new document, local open, and initial landing strip", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toMatch(/handleNewDocument[\s\S]*?setDocInUrl\(null\)/);
    expect(src).toMatch(/handleNewDocument[\s\S]*?bumpEditorSession\(\)/);
    expect(src).toMatch(/handleFileChange[\s\S]*?setDocInUrl\(null\)/);
    expect(src).toMatch(/Always start blank[\s\S]*?setDocInUrl\(null\)/);
  });

  it("sets ?doc= when opening or saving vault documents", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).toMatch(/handleOpenVaultDocument[\s\S]*?setDocInUrl\(id\)/);
    expect(src).toMatch(/performVaultSave[\s\S]*?setDocInUrl\(id\)/);
  });

  it("vault sheet is gated to signed-in users via title bar", () => {
    const shell = shellSrc();
    const sheet = readFileSync(vaultSheetPath, "utf8");

    expect(shell).toContain("showMyDocuments={!!initialUser}");
    expect(shell).toContain("VaultDocumentsSheet");
    expect(shell).toContain("setVaultSheetOpen");
    expect(shell).toMatch(
      /handleOpenVaultDocument[\s\S]*?setVaultSheetOpen\(false\)/
    );
    expect(sheet).toContain("EncryptionGateApp");
    expect(sheet).not.toContain("getLoginUrl");
  });

  it("use-docs fetches via shared getDocsApiPath helper", () => {
    const src = readFileSync(useDocsPath, "utf8");

    expect(src).toContain('from "@/lib/docs-zone-path"');
    expect(src).toContain("getDocsApiPath");
    expect(src).not.toMatch(/const DOCS_BASE_PATH\s*=/);
    expect(src).toContain('getDocsApiPath("/api/docs")');
    expect(src).toContain("getDocsApiPath(`/api/docs/${id}`)");
  });
});
