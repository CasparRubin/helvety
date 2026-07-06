import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("gateway home page", () => {
  it("server-renders marketing shell on a plain theme background", () => {
    const src = readFileSync(pagePath, "utf8");

    expect(src).toContain("HeroMarketingShell");
    expect(src).toMatch(/plain theme background/i);
    expect(src).not.toContain("HeroSection");
    expect(src).not.toContain('"use client"');
    expect(src).not.toMatch(/Hyperspeed|SideRays|light-pillar|WebGL/i);
  });
});
