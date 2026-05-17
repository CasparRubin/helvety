import { HELVETY_ACCENT_RED } from "@helvety/brand";
import { describe, expect, it } from "vitest";

import { getHelvetyLightPillarOptions } from "./helvety-light-pillar-preset";

/** React Bits default colors in {@link ./LightPillar.tsx} (purple/pink demo). */
const REACT_BITS_TEMPLATE_COLORS = {
  topColor: "#5227FF",
  bottomColor: "#FF9FFC",
} as const;

describe("Helvety Light Pillar preset", () => {
  it("uses white + red in dark mode and black + red in light mode", () => {
    const dark = getHelvetyLightPillarOptions(true);
    const light = getHelvetyLightPillarOptions(false);

    expect(dark.topColor).toBe("#ffffff");
    expect(dark.bottomColor).toBe(HELVETY_ACCENT_RED);
    expect(light.topColor).toBe("#000000");
    expect(light.bottomColor).toBe(HELVETY_ACCENT_RED);

    expect(dark.topColor).not.toBe(REACT_BITS_TEMPLATE_COLORS.topColor);
    expect(dark.bottomColor).not.toBe(REACT_BITS_TEMPLATE_COLORS.bottomColor);
  });

  it("matches the React Bits template tuning (colors aside)", () => {
    expect(getHelvetyLightPillarOptions(true)).toMatchObject({
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

  it("uses screen blend in dark and multiply in light; quality stays default", () => {
    expect(getHelvetyLightPillarOptions(true).mixBlendMode).toBe("screen");
    expect(getHelvetyLightPillarOptions(false).mixBlendMode).toBe("multiply");
    expect(getHelvetyLightPillarOptions(true)).not.toHaveProperty("quality");
  });
});
