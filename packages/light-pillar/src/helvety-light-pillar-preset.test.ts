import { HELVETY_ACCENT_RED } from "@helvety/brand";
import { describe, expect, it } from "vitest";

import { HELVETY_LIGHT_PILLAR_OPTIONS } from "./helvety-light-pillar-preset";

/** React Bits default colors in {@link ./LightPillar.tsx} (purple/pink demo). */
const REACT_BITS_TEMPLATE_COLORS = {
  topColor: "#5227FF",
  bottomColor: "#FF9FFC",
} as const;

describe("Helvety Light Pillar preset", () => {
  it("uses Helvety red and white instead of the React Bits template colors", () => {
    expect(HELVETY_LIGHT_PILLAR_OPTIONS.topColor).toBe("#ffffff");
    expect(HELVETY_LIGHT_PILLAR_OPTIONS.bottomColor).toBe(HELVETY_ACCENT_RED);
    expect(HELVETY_LIGHT_PILLAR_OPTIONS.topColor).not.toBe(
      REACT_BITS_TEMPLATE_COLORS.topColor
    );
    expect(HELVETY_LIGHT_PILLAR_OPTIONS.bottomColor).not.toBe(
      REACT_BITS_TEMPLATE_COLORS.bottomColor
    );
  });

  it("matches the React Bits template tuning (colors aside)", () => {
    expect(HELVETY_LIGHT_PILLAR_OPTIONS).toMatchObject({
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
    expect(HELVETY_LIGHT_PILLAR_OPTIONS).not.toHaveProperty("mixBlendMode");
    expect(HELVETY_LIGHT_PILLAR_OPTIONS).not.toHaveProperty("quality");
  });
});
