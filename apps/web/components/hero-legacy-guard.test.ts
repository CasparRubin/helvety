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
    expect(readme).toContain("HELVETY_COMPANY_VALUES_TAGLINE");
    expect(readme).toContain("ElectricBorder");
    expect(readme).toContain("HeroCompanyValuesTagline");
    expect(readme).toContain("private · simple · clean");
    expect(readme).toContain("text-base");
    expect(readme).toContain("2000ms");
    expect(readme).toContain("canUseWebGL");
    expect(readme).not.toContain("700ms");
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

  it("production hero shell uses ElectricBorder tagline with middle-dot copy", () => {
    const shell = readFileSync(
      join(webRoot, "components/hero-marketing-shell.tsx"),
      "utf8"
    );
    const copy = readFileSync(
      join(webRoot, "components/hero-company-values-copy.ts"),
      "utf8"
    );
    expect(shell).toContain("HeroCompanyValuesTagline");
    expect(shell).not.toContain("@helvety/ui/badge");
    expect(copy).toContain("HERO_COMPANY_VALUES_TAGLINE_DISPLAY");
    expect(copy).toContain('.join(" · ")');
    expect(shell).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("ui-shadcn policy documents current gateway hero behavior", () => {
    const policy = readFileSync(
      join(webRoot, "..", "..", "docs", "ui-shadcn-integration-policy.md"),
      "utf8"
    );
    expect(policy).toContain("HELVETY_COMPANY_VALUES_TAGLINE");
    expect(policy).toContain("ElectricBorder");
    expect(policy).toMatch(/private\s*·\s*simple/i);
    expect(policy).toContain("text-base");
    expect(policy).toContain("2000ms");
    expect(policy).toContain("canUseWebGL");
    expect(policy).not.toContain("700ms");
  });

  it("hero-text JSDoc points at production shell, not removed harness", () => {
    const heroText = readFileSync(
      join(webRoot, "components/hero-text.tsx"),
      "utf8"
    );
    expect(heroText).toContain("hero-marketing-shell");
    expect(heroText).toMatch(/ElectricBorder/i);
    expect(heroText).not.toContain("hero-section");
  });
});
