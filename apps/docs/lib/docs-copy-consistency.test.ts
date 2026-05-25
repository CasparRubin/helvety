import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { describe, expect, it } from "vitest";

import { DOCS_PWA_MANIFEST_DESCRIPTION } from "./product-copy";

const libDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(libDir, "../../..");
const docsZonePath = join(libDir, "docs-zone-path.ts");
const shellPath = join(libDir, "../components/helvety-docs-shell.tsx");
const readmePath = join(libDir, "../README.md");
const llmsPath = join(libDir, "../public/llms.txt");
const uiReadmePath = join(repoRoot, "packages/ui/README.md");

/** User-facing and maintainer copy stays aligned with product behavior. */
describe("docs copy consistency", () => {
  it("zone-path module documents ?doc= as bookmark not auto-open", () => {
    const src = readFileSync(docsZonePath, "utf8");

    expect(src).toMatch(/vault bookmark/i);
    expect(src).toMatch(/My documents sheet/i);
    expect(src).toMatch(/not an[\s\S]*auto-open deep link/i);
    expect(src).toMatch(/starts blank/i);
  });

  it("shell does not auto-open vault documents on sign-in", () => {
    const src = readFileSync(shellPath, "utf8");

    expect(src).not.toContain("handleOpenVaultDocument(docId)");
    expect(src).toMatch(/Always start blank[\s\S]*?setDocInUrl\(null\)/);
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
    expect(readme).toContain("docx-editor-theme-tokens.ts");
    expect(readme).toMatch(/Eigenpal upgrade checklist/i);
    expect(readme).toMatch(/no default doc icon column/i);
    expect(readme).toMatch(/no \*\*Help\*\* menu/i);
    expect(readme).toMatch(/\*\*File\*\*, \*\*Format\*\*, and \*\*Insert\*\*/i);
    expect(readme).toMatch(/no \*\*comment\*\* UI/i);
    expect(readme).toMatch(/My documents/i);
    expect(readme).toMatch(/seamless stack/i);
    expect(readme).toMatch(/matching left\/right borders/i);
    expect(readme).toMatch(/workspace gutter/i);
    expect(readme).toMatch(/Layer 8/i);
    expect(readme).toMatch(/light and dark/i);
    expect(readme).not.toMatch(/Layers 4–7/i);
    expect(llms).toMatch(/## User Interface/);
    expect(llms).toMatch(/light and dark mode/i);
    expect(llms).toMatch(/pinned command bar/i);
    expect(llms).toMatch(/File\/Format\/Insert/i);
    expect(llms).toMatch(/matching left\/right borders/i);
    expect(llms).toMatch(/not Help/i);
    expect(llms).toMatch(/Help menu are hidden/i);
    expect(llms).toMatch(/menus, dropdowns, and tooltips/i);
    expect(llms).toMatch(/printable document page stays white/i);
    expect(llms).toMatch(/print-accurate|exported .docx/i);

    for (const doc of [readme, llms]) {
      expect(doc).not.toMatch(/auto-opened on load/i);
      expect(doc).not.toMatch(/vault sidebar/i);
      expect(doc).not.toMatch(/left sidebar/i);
      expect(doc).not.toMatch(/VaultPanel/i);
      expect(doc).not.toMatch(/all menus are hidden/i);
      expect(doc).not.toMatch(/menus are hidden/i);
    }
  });

  it("README documents disabled comment UI without implying full OOXML stripping", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toMatch(/Comments:/i);
    expect(readme).toMatch(/cannot add, view, or edit comments/i);
    expect(readme).not.toMatch(/strip(s|ped)?\s+comments\s+from/i);
  });

  it("monorepo UI package README describes docs vault sheet, not a permanent sidebar", () => {
    const uiReadme = readFileSync(uiReadmePath, "utf8");

    expect(uiReadme).not.toMatch(/vault sidebar/i);
    expect(uiReadme).toMatch(/My documents.*vault sheet|vault sheet/i);
  });

  it("README security and database sections match vault access model", () => {
    const readme = readFileSync(readmePath, "utf8");

    expect(readme).toMatch(/authenticated user[\s\S]*Supabase client/i);
    expect(readme).toMatch(/does \*\*not\*\* use `createAdminClient\(\)`/i);
    expect(readme).toMatch(/hosted \*\*helvety\*\* Supabase project/i);
    expect(readme).toMatch(/getSupabase\.sql/);
    expect(readme).not.toMatch(/supabase\/migrations\//);
    expect(readme).not.toMatch(/admin client for vault/i);
    expect(readme).not.toMatch(/production already has these via MCP/i);
  });
});
