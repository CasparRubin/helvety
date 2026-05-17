import {
  HELVETY_ACCENT_RED_RGB,
  REACT_BITS_PRIMARY_RGB_DARK,
  REACT_BITS_PRIMARY_RGB_LIGHT,
} from "@helvety/brand";
import { describe, expect, it } from "vitest";

import { getHeroHyperspeedEffectOptions } from "./hero-hyperspeed-options";
import { hyperspeedDefaultPreset } from "./hyperspeed-default-preset";

describe("Hyperspeed effect options", () => {
  it("default preset uses turbulent distortion and current variation tuning", () => {
    expect(hyperspeedDefaultPreset.distortion).toBe("turbulentDistortion");

    const variation = hyperspeedDefaultPreset.variation;

    expect(variation).toBeDefined();
    expect(variation.enabled).toBe(true);
    expect(variation.intensity).toBe(0.26);
    expect(variation.maxDelta).toBe(0.04);
    expect(variation.reseedIntervalMs).toBe(3200);
    expect(variation.mobileScale).toBe(0.55);
  });

  it("hero options keep base variation safety with calmer reseed than default preset", () => {
    const baseVariation = hyperspeedDefaultPreset.variation;
    const heroVariation = getHeroHyperspeedEffectOptions(true).variation;

    expect(heroVariation).toBeDefined();
    if (!heroVariation) {
      throw new Error("Expected hero variation config to be defined");
    }
    expect(heroVariation.enabled).toBe(baseVariation.enabled);
    expect(heroVariation.mobileScale).toBe(baseVariation.mobileScale);
    expect(heroVariation.maxDelta).toBe(baseVariation.maxDelta);
    expect(heroVariation.intensity).toBe(baseVariation.intensity);
    expect(heroVariation.reseedIntervalMs).toBe(4200);
  });

  it("dark mode uses white lane markings and Helvety red tail lights", () => {
    const { colors } = getHeroHyperspeedEffectOptions(true);
    if (!colors) {
      throw new Error("Expected hero colors config to be defined");
    }
    expect(colors.shoulderLines).toBe(REACT_BITS_PRIMARY_RGB_DARK);
    expect(colors.brokenLines).toBe(REACT_BITS_PRIMARY_RGB_DARK);
    expect(colors.sticks).toBe(REACT_BITS_PRIMARY_RGB_DARK);
    expect(colors.leftCars).toEqual([
      HELVETY_ACCENT_RED_RGB,
      0xe31b2b,
      0xff3344,
    ]);
    expect(colors.rightCars).toContain(0xffffff);
  });

  it("light mode uses black lane markings and Helvety red tail lights", () => {
    const { colors } = getHeroHyperspeedEffectOptions(false);
    if (!colors) {
      throw new Error("Expected hero colors config to be defined");
    }
    expect(colors.shoulderLines).toBe(REACT_BITS_PRIMARY_RGB_LIGHT);
    expect(colors.brokenLines).toBe(REACT_BITS_PRIMARY_RGB_LIGHT);
    expect(colors.sticks).toBe(REACT_BITS_PRIMARY_RGB_LIGHT);
    expect(colors.leftCars).toEqual([
      HELVETY_ACCENT_RED_RGB,
      0xe31b2b,
      0xff3344,
    ]);
    expect(colors.rightCars).toContain(0x000000);
  });

  it("light mode uses a lower bloom threshold so motion glow reads on asphalt", () => {
    const dark = getHeroHyperspeedEffectOptions(true);
    const light = getHeroHyperspeedEffectOptions(false);
    expect(dark.bloom?.luminanceThreshold).toBe(0.2);
    expect(light.bloom?.luminanceThreshold).toBeLessThan(
      dark.bloom?.luminanceThreshold ?? 1
    );
  });
});
