import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const llmsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/llms.txt"
);

describe("Helvety Docs llms.txt", () => {
  const source = readFileSync(llmsPath, "utf8");

  it("documents hybrid local edit and optional vault behavior", () => {
    expect(source).toMatch(/\.docx/i);
    expect(source).toMatch(/no account/i);
    expect(source).toMatch(/optional vault/i);
    expect(source).toMatch(/before storage/i);
  });

  it("documents vault bookmarks, blank-on-load, and sheet open flow", () => {
    expect(source).toMatch(/\?doc=/);
    expect(source).toMatch(/starts blank on load/i);
    expect(source).toMatch(/not auto-opened/i);
    expect(source).toMatch(/\*\*New\*\*/);
    expect(source).toMatch(/My documents/i);
    expect(source).toMatch(/title bar sheet/i);
    expect(source).toMatch(/signed in and vault-unlocked/i);
    expect(source).not.toMatch(
      /opens a saved document when you are signed in/i
    );
    expect(source).not.toMatch(/Vault deep links/i);
  });

  it("links to canonical routes and related Helvety apps", () => {
    expect(source).toContain("https://helvety.com/docs");
    expect(source).toContain("https://helvety.com/store/products/helvety-docs");
    expect(source).toContain("https://helvety.com/pdf");
    expect(source).toMatch(/Apache-2\.0/);
  });

  it("documents light/dark UI and white document page for export", () => {
    expect(source).toMatch(/## User Interface/);
    expect(source).toMatch(/light and dark mode/i);
    expect(source).toMatch(/Eigenpal title bar/i);
    expect(source).toMatch(/single toolbar stack/i);
    expect(source).toMatch(/File\/Format\/Insert/i);
    expect(source).toMatch(/not Help/i);
    expect(source).toMatch(/matching borders/i);
    expect(source).toMatch(/comment UI is disabled/i);
    expect(source).toMatch(/menus, dropdowns, and tooltips/i);
    expect(source).not.toMatch(/vault sidebar/i);
    expect(source).not.toMatch(/command bar sheet/i);
    expect(source).not.toMatch(/pinned command bar/i);
    expect(source).toMatch(/Help menu.*hidden|File → Open\/Save/i);
    expect(source).not.toMatch(/not File or Help/i);
    expect(source).toMatch(/printable document page stays white/i);
    expect(source).toMatch(/print-accurate/i);
    expect(source).not.toMatch(/menus are hidden/i);
  });

  it("documents crawl rules aligned with robots.txt", () => {
    expect(source).toMatch(/\/docs.*indexable/i);
    expect(source).toMatch(/site-root `\/api`/);
    expect(source).toMatch(/\/docs\/api.*authentication/i);
  });
});
