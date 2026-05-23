import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { describe, expect, it } from "vitest";

import { DOCS_PWA_MANIFEST_DESCRIPTION } from "./product-copy";

const libDir = dirname(fileURLToPath(import.meta.url));
const docsZonePath = join(libDir, "docs-zone-path.ts");
const vaultPanelPath = join(libDir, "../components/vault-panel.tsx");
const readmePath = join(libDir, "../README.md");
const llmsPath = join(libDir, "../public/llms.txt");

/** User-facing and maintainer copy stays aligned with product behavior. */
describe("docs copy consistency", () => {
  it("zone-path module documents ?doc= as bookmark not auto-open", () => {
    const src = readFileSync(docsZonePath, "utf8");

    expect(src).toMatch(/vault bookmark/i);
    expect(src).toMatch(/not an[\s\S]*auto-open deep link/i);
    expect(src).toMatch(/starts blank/i);
  });

  it("vault panel sign-in comment does not promise auto-open after login", () => {
    const src = readFileSync(vaultPanelPath, "utf8");

    expect(src).toMatch(/editor still starts blank/i);
    expect(src).not.toMatch(/opens the document after sign-in/i);
  });

  it("SEO and PWA descriptions stay hybrid (local edit, optional vault) without implying ?doc= auto-open", () => {
    for (const text of [DOCS_APP_DESCRIPTION, DOCS_PWA_MANIFEST_DESCRIPTION]) {
      expect(text).toMatch(/no account|without signing in|local editing/i);
      expect(text).toMatch(/optional vault/i);
      expect(text).not.toMatch(/\?doc=/);
      expect(text).not.toMatch(/deep link/i);
    }
  });

  it("README and llms.txt document theme and white-page export behavior", () => {
    const readme = readFileSync(readmePath, "utf8");
    const llms = readFileSync(llmsPath, "utf8");

    expect(readme).toMatch(/## Theme \(light \/ dark\)/);
    expect(readme).toContain("docx-editor-helvety-bridge.css");
    expect(llms).toMatch(/## User Interface/);
    expect(llms).toMatch(/light and dark mode/i);
    expect(llms).toMatch(/white/i);
    expect(llms).toMatch(/print-accurate|exported .docx/i);

    for (const doc of [readme, llms]) {
      expect(doc).not.toMatch(/auto-opened on load/i);
    }
  });
});
