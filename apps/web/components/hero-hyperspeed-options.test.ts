import { describe, expect, it } from "vitest";

import { HERO_HYPERSPEED_EFFECT_OPTIONS } from "./hero-hyperspeed-options";
import { hyperspeedDefaultPreset } from "./hyperspeed-default-preset";

describe("Hyperspeed effect options", () => {
  it("default preset exposes bounded variation controls", () => {
    const variation = hyperspeedDefaultPreset.variation;

    expect(variation).toBeDefined();
    expect(variation.enabled).toBe(true);
    expect(variation.intensity).toBeGreaterThan(0);
    expect(variation.intensity).toBeLessThanOrEqual(1);
    expect(variation.mobileScale).toBeGreaterThan(0);
    expect(variation.mobileScale).toBeLessThanOrEqual(1);
    expect(variation.maxDelta).toBeGreaterThan(0);
    expect(variation.maxDelta).toBeLessThanOrEqual(0.25);
    expect(variation.reseedIntervalMs).toBeGreaterThanOrEqual(800);
  });

  it("hero options keep base variation safety while applying subtle tuning", () => {
    const baseVariation = hyperspeedDefaultPreset.variation;
    const heroVariation = HERO_HYPERSPEED_EFFECT_OPTIONS.variation;

    expect(heroVariation).toBeDefined();
    if (!heroVariation) {
      throw new Error("Expected hero variation config to be defined");
    }
    expect(heroVariation.enabled).toBe(baseVariation.enabled);
    expect(heroVariation.mobileScale).toBe(baseVariation.mobileScale);
    expect(heroVariation.maxDelta).toBe(baseVariation.maxDelta);
    expect(heroVariation.intensity).toBeGreaterThan(baseVariation.intensity);
    expect(heroVariation.reseedIntervalMs).toBeLessThanOrEqual(
      baseVariation.reseedIntervalMs
    );
  });
});
