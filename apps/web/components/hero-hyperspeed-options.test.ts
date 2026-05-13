import { describe, expect, it } from "vitest";

import { HERO_HYPERSPEED_EFFECT_OPTIONS } from "./hero-hyperspeed-options";
import { hyperspeedDefaultPreset } from "./hyperspeed-default-preset";

describe("Hyperspeed effect options", () => {
  it("default preset uses turbulent distortion and current variation tuning", () => {
    expect(hyperspeedDefaultPreset.distortion).toBe("turbulentDistortion");

    const variation = hyperspeedDefaultPreset.variation;

    expect(variation).toBeDefined();
    expect(variation.enabled).toBe(true);
    expect(variation.intensity).toBe(0.28);
    expect(variation.maxDelta).toBe(0.055);
    expect(variation.reseedIntervalMs).toBe(3200);
    expect(variation.mobileScale).toBe(0.55);
    expect(variation.intensity).toBeLessThanOrEqual(1);
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
    expect(heroVariation.intensity).toBe(0.36);
    expect(heroVariation.intensity).toBeGreaterThan(baseVariation.intensity);
    expect(heroVariation.reseedIntervalMs).toBe(3000);
    expect(heroVariation.reseedIntervalMs).toBeLessThanOrEqual(
      baseVariation.reseedIntervalMs
    );
  });

  it("hero preset keeps white lane markings and Helvety car streak colors", () => {
    const { colors } = HERO_HYPERSPEED_EFFECT_OPTIONS;
    if (!colors) {
      throw new Error("Expected hero colors config to be defined");
    }
    expect(colors.shoulderLines).toBe(0xffffff);
    expect(colors.brokenLines).toBe(0xffffff);
    expect(colors.sticks).toBe(0xffffff);
    expect(colors.leftCars).toEqual([0xff102a, 0xe31b2b, 0xff3344]);
    expect(colors.rightCars).toEqual([0xf5f5f5, 0xffffff, 0xffe8e8]);
  });
});
