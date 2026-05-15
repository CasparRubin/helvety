import { describe, expect, it } from "vitest";

import { STORE_LIGHT_PILLAR_OPTIONS } from "./store-light-pillar-options";

/** React Bits default colors in {@link ./LightPillar.tsx} (purple/pink demo). */
const REACT_BITS_TEMPLATE_COLORS = {
  topColor: "#5227FF",
  bottomColor: "#FF9FFC",
} as const;

describe("Store Light Pillar options", () => {
  it("uses Helvety red and white instead of the React Bits template colors", () => {
    expect(STORE_LIGHT_PILLAR_OPTIONS.topColor).toBe("#ffffff");
    expect(STORE_LIGHT_PILLAR_OPTIONS.bottomColor).toBe("#ff102a");
    expect(STORE_LIGHT_PILLAR_OPTIONS.topColor).not.toBe(
      REACT_BITS_TEMPLATE_COLORS.topColor
    );
    expect(STORE_LIGHT_PILLAR_OPTIONS.bottomColor).not.toBe(
      REACT_BITS_TEMPLATE_COLORS.bottomColor
    );
  });

  it("matches the React Bits template tuning (colors aside)", () => {
    expect(STORE_LIGHT_PILLAR_OPTIONS).toMatchObject({
      intensity: 1,
      rotationSpeed: 0.3,
      interactive: false,
      glowAmount: 0.002,
      pillarWidth: 3,
      pillarHeight: 0.2,
      noiseIntensity: 0.5,
      pillarRotation: 25,
    });
  });

  it("leaves mixBlendMode and quality at LightPillar defaults (screen, high)", () => {
    expect(STORE_LIGHT_PILLAR_OPTIONS).not.toHaveProperty("mixBlendMode");
    expect(STORE_LIGHT_PILLAR_OPTIONS).not.toHaveProperty("quality");
  });
});
