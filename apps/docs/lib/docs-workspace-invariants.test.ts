import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(libDir, "../app");
const componentsDir = join(libDir, "../components");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const workspacePath = join(componentsDir, "docx-editor-workspace.tsx");
const commandBarPath = join(componentsDir, "docs-command-bar.tsx");
const vaultPanelPath = join(componentsDir, "vault-panel.tsx");
const pagePath = join(appDir, "page.tsx");
const readmePath = join(libDir, "../README.md");
const llmsPath = join(libDir, "../public/llms.txt");

/**
 * Source invariants for Docs editor UX (scroll chain, blank-on-load, Helvety styling).
 * Theme bridge coverage: `docx-editor-theme.test.ts`.
 */
describe("docs workspace UX invariants", () => {
  it("shell and page establish h-full height chain for overflow-main", () => {
    const shell = readFileSync(shellPath, "utf8");
    const page = readFileSync(pagePath, "utf8");

    expect(shell).toMatch(/flex h-full min-h-0 flex-col/);
    expect(page).toMatch(/flex h-full items-center justify-center/);
  });

  it("docx editor workspace fills height for internal document scroll", () => {
    const src = readFileSync(workspacePath, "utf8");

    expect(src).toContain("docx-editor-workspace");
    expect(src).toMatch(/flex h-full min-h-0 flex-1 flex-col overflow-hidden/);
    expect(src).toContain("bg-background");
    expect(src).toContain('className="h-full min-h-0 flex-1"');
    expect(src).not.toContain("@eigenpal/docx-editor-react/styles.css");
  });

  it("vault list buttons use square Helvety corners", () => {
    const src = readFileSync(vaultPanelPath, "utf8");

    expect(src).toContain("rounded-none");
    expect(src).not.toContain("rounded-md");
  });

  it("command bar buttons use square Helvety corners", () => {
    const src = readFileSync(commandBarPath, "utf8");

    expect(src).toContain('commandButtonClassName = "rounded-none"');
    expect(src.match(/className=\{commandButtonClassName\}/g)?.length).toBe(4);
  });

  it("shell workspace row uses themed background", () => {
    const shell = readFileSync(shellPath, "utf8");

    expect(shell).toContain("bg-background flex min-h-0 flex-1");
  });

  it("does not auto-open vault documents from ?doc= on load", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).not.toContain("handleOpenVaultDocument(docId)");
    expect(src).toContain("initialDocIdRef");
    expect(src).toContain("strippedInitialDeepLinkRef");

    const stripEffect = src.match(
      /Always start blank[\s\S]*?useEffect\([\s\S]*?\},\s*\[([^\]]*)\]\)/
    );
    expect(stripEffect).not.toBeNull();
    expect(stripEffect?.[0]).not.toContain("handleOpenVaultDocument");
    expect(stripEffect?.[0]).toContain("setDocInUrl(null)");
    expect(stripEffect?.[1]).not.toContain("searchParams");
    expect(stripEffect?.[1]).toContain("setDocInUrl");
  });

  it("README and llms.txt document blank-on-load and vault bookmarks", () => {
    const readme = readFileSync(readmePath, "utf8");
    const llms = readFileSync(llmsPath, "utf8");

    for (const doc of [readme, llms]) {
      expect(doc).toMatch(/\?doc=/);
      expect(doc).toMatch(
        /starts blank|always starts blank|always starts with a blank/i
      );
      expect(doc).toMatch(/vault sidebar|My documents/i);
      expect(doc).not.toMatch(/opens a saved document when you are signed in/i);
      expect(doc).not.toMatch(/Vault deep links:/i);
      expect(doc).not.toMatch(/auto-opened on load/i);
    }

    expect(readme).toMatch(/not an auto-open deep link/i);
    expect(llms).toMatch(/not auto-opened/i);
  });
});
