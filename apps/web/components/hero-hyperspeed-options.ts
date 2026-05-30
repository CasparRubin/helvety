import {
  getHelvetyCanvasBackgroundRgb,
  getHelvetyCanvasIslandRgb,
  getHelvetyCanvasRoadRgb,
  getReactBitsHeadlightRgb,
  getReactBitsPrimaryRgb,
  HELVETY_ACCENT_RED_RGB,
} from "@helvety/brand";

import { hyperspeedDefaultPreset } from "@/components/hyperspeed-default-preset";

import type Hyperspeed from "@/components/vendor/Hyperspeed";
import type { ComponentProps } from "react";

/** `effectOptions` shape accepted by default Hyperspeed export. */
export type HyperspeedEffectOptions = NonNullable<
  ComponentProps<typeof Hyperspeed>["effectOptions"]
>;

const base = hyperspeedDefaultPreset;

/**
 * Hero backdrop: default turbulent scene with brand pair
 * dark = white + red, light = black + red (white → black swap on lane lines and headlights).
 */
export function getHeroHyperspeedEffectOptions(
  isDark: boolean
): HyperspeedEffectOptions {
  const primary = getReactBitsPrimaryRgb(isDark);
  const headlight = getReactBitsHeadlightRgb(isDark);

  return {
    ...base,
    variation: {
      ...base.variation,
      intensity: 0.26,
      reseedIntervalMs: 4200,
    },
    /* Light: lower threshold so red taillights / sticks bloom on the darker asphalt. */
    bloom: {
      luminanceThreshold: isDark ? 0.2 : 0.1,
    },
    colors: {
      ...base.colors,
      background: getHelvetyCanvasBackgroundRgb(isDark),
      roadColor: getHelvetyCanvasRoadRgb(isDark),
      islandColor: getHelvetyCanvasIslandRgb(isDark),
      shoulderLines: primary,
      brokenLines: primary,
      sticks: primary,
      leftCars: [HELVETY_ACCENT_RED_RGB, 0xe31b2b, 0xff3344],
      rightCars: [...headlight],
    },
  } as HyperspeedEffectOptions;
}
