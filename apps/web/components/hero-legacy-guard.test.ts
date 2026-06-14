import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("hero legacy cleanup guards", () => {
  it("does not keep the removed hero-section harness", () => {
    expect(existsSync(join(webRoot, "components/hero-section.tsx"))).toBe(
      false
    );
    expect(existsSync(join(webRoot, "components/hero-section.test.tsx"))).toBe(
      false
    );
  });

  it("README documents production hero stack without hero-section reference", () => {
    const readme = readFileSync(join(webRoot, "README.md"), "utf8");
    expect(readme).toContain("HeroMarketingShell");
    expect(readme).toContain("HeroHyperspeedLayer");
    expect(readme).not.toContain("components/hero-section.tsx");
    expect(readme).not.toMatch(/Legacy [`[]HeroSection/);
    expect(readme).toMatch(
      /does \*\*not\*\* mount them|does \*\*not\*\* import/i
    );
    expect(readme).not.toMatch(
      /Production `\/` composes hero copy[\s\S]*with presets from/i
    );
  });

  it("production hero shell does not import React Bits text presets", () => {
    const shell = readFileSync(
      join(webRoot, "components/hero-marketing-shell.tsx"),
      "utf8"
    );
    expect(shell).not.toContain("hero-text");
    expect(shell).not.toContain("Shuffle");
    expect(shell).not.toContain("ShinyText");
  });

  it("hero-text JSDoc points at production shell, not removed harness", () => {
    const heroText = readFileSync(
      join(webRoot, "components/hero-text.tsx"),
      "utf8"
    );
    expect(heroText).toContain("hero-marketing-shell");
    expect(heroText).not.toContain("hero-section");
  });
});
