import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const layoutPath = join(dirname(fileURLToPath(import.meta.url)), "layout.tsx");

describe("store root layout shell providers", () => {
  it("wraps shell in CSRF", () => {
    const src = readFileSync(layoutPath, "utf8");

    expect(src).toContain("<CSRFProvider csrfToken={csrfToken}>");
    expect(src).toContain("wrapInsideTooltipProvider");
    expect(src).toMatch(/\{\s*shell\s*\}/);

    const csrfOpen = src.indexOf("<CSRFProvider");
    const csrfClose = src.lastIndexOf("</CSRFProvider>");
    const wrapFn = src.indexOf("wrapInsideTooltipProvider");

    expect(wrapFn).toBeGreaterThan(-1);
    expect(csrfOpen).toBeLessThan(csrfClose);
  });
});
