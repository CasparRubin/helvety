import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

/**
 * Contract for gateway shell scroll viewport: must paint a solid themed surface
 * behind full-bleed hero content (see layout.tsx).
 */
describe("web root layout shell props", () => {
  it("keeps scroll viewport overflow-visible and bg-background for Hyperspeed bleed", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain(
      'scrollAreaViewportClassName: "!overflow-visible bg-background"'
    );
  });

  it("keeps horizontal clip on body without dropping shell body background", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain('bodyClassName: "overflow-x-clip"');
  });

  it("documents head theme init for correct tokens before body paint", () => {
    const src = readFileSync(layoutPath, "utf8");
    expect(src).toContain("HelvetyThemeInitScript");
    expect(src).toContain("in `<head>`");
  });
});
