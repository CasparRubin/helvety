import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDir = dirname(fileURLToPath(import.meta.url));

describe("docs Material Symbols self-hosting", () => {
  it("loads icons from local WOFF2 via next/font/local (no Google CDN CSS)", () => {
    const fontsSrc = readFileSync(join(appDir, "../lib/fonts.ts"), "utf8");
    const globalsSrc = readFileSync(join(appDir, "globals.css"), "utf8");
    const fontPath = join(appDir, "fonts/material-symbols-outlined.woff2");

    expect(fontsSrc).toContain('from "next/font/local"');
    expect(fontsSrc).toContain("material-symbols-outlined.woff2");
    expect(existsSync(fontPath)).toBe(true);
    expect(globalsSrc).not.toContain("fonts.googleapis.com");
    expect(globalsSrc).toContain("--font-material-symbols");
  });

  it("applies the material symbols CSS variable on the root layout body", () => {
    const layoutSrc = readFileSync(join(appDir, "layout.tsx"), "utf8");

    expect(layoutSrc).toContain("materialSymbols.variable");
    expect(layoutSrc).toContain("@/lib/fonts");
  });

  it("does not enable googleFonts CSP on the docs proxy (icons are self-hosted)", () => {
    const proxySrc = readFileSync(join(appDir, "../proxy.ts"), "utf8");

    expect(proxySrc).toContain('createProfiledSecurityProxy("public-tool"');
    expect(proxySrc).not.toMatch(/googleFonts\s*:\s*true/);
  });
});
