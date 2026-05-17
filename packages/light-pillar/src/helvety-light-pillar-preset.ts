import { getReactBitsPrimaryColor, HELVETY_ACCENT_RED } from "@helvety/brand";

import type LightPillar from "./LightPillar";
import type { ComponentProps } from "react";

/** Props shape accepted by {@link LightPillar} for the Helvety shell preset. */
export type HelvetyLightPillarOptions = ComponentProps<typeof LightPillar>;

const HELVETY_LIGHT_PILLAR_TUNING = {
  intensity: 1,
  rotationSpeed: 0.3,
  interactive: false,
  glowAmount: 0.002,
  pillarWidth: 3,
  pillarHeight: 0.2,
  noiseIntensity: 0.5,
  pillarRotation: 25,
} as const satisfies Omit<
  HelvetyLightPillarOptions,
  "topColor" | "bottomColor"
>;

/**
 * Helvety shell preset: React Bits Light Pillar with brand pair
 * dark = white + red, light = black + red.
 * `mixBlendMode` is `screen` in dark and `multiply` in light; `quality` uses the component default (`high`).
 */
export function getHelvetyLightPillarOptions(
  isDark: boolean
): HelvetyLightPillarOptions {
  return {
    ...HELVETY_LIGHT_PILLAR_TUNING,
    topColor: getReactBitsPrimaryColor(isDark),
    bottomColor: HELVETY_ACCENT_RED,
    // `screen` on dark; `multiply` keeps black/red readable on cream `bg-background`.
    mixBlendMode: isDark ? "screen" : "multiply",
  };
}
