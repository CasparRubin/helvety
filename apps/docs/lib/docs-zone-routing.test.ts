import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const libDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(libDir, "../components");
const hooksDir = join(libDir, "../hooks");

const shellPath = join(componentsDir, "helvety-docs-shell.tsx");
const vaultPanelPath = join(componentsDir, "vault-panel.tsx");
const useDocsPath = join(hooksDir, "use-docs.ts");
const readmePath = join(libDir, "../README.md");

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
    expect(src).toMatch(/setDocInUrl\(null\)/g);
    expect(src.match(/setDocInUrl\(null\)/g)?.length).toBe(2);
    expect(src).toMatch(/setDocInUrl\(id\)/g);
    expect(src.match(/setDocInUrl\(id\)/g)?.length).toBe(2);
    expect(src).toContain("currentDoc === docId");
    expect(src).toContain("scroll: false");
  });

  it("vault sign-in uses buildDocsPublicPath for post-login return", () => {
    const src = readFileSync(vaultPanelPath, "utf8");

    expect(src).toContain("buildDocsPublicPath");
    expect(src).toContain("getLoginUrl");
    expect(src).not.toMatch(/getLoginUrl\(returnPath/);
    expect(src).not.toMatch(/returnPath \|\| ["'`]\/docs["'`]/);
  });

  it("use-docs fetches via shared getDocsApiPath helper", () => {
    const src = readFileSync(useDocsPath, "utf8");

    expect(src).toContain('from "@/lib/docs-zone-path"');
    expect(src).toContain("getDocsApiPath");
    expect(src).not.toMatch(/const DOCS_BASE_PATH\s*=/);
    expect(src).toContain('getDocsApiPath("/api/docs")');
    expect(src).toContain("getDocsApiPath(`/api/docs/${id}`)");
  });

  it("README documents basePath routing rules and /docs/docs footgun", () => {
    const src = readFileSync(readmePath, "utf8");

    expect(src).toContain("## Routing (`basePath: /docs`)");
    expect(src).toContain("docs-zone-path.ts");
    expect(src).toContain("/docs/docs");
    expect(src).toMatch(/\?doc=/);
  });
});
