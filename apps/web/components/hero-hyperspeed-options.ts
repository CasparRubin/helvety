import { hyperspeedDefaultPreset } from "@/components/hyperspeed-default-preset";

import type Hyperspeed from "@/components/Hyperspeed";
import type { ComponentProps } from "react";

/** `effectOptions` shape accepted by default Hyperspeed export. */
export type HyperspeedEffectOptions = NonNullable<
  ComponentProps<typeof Hyperspeed>["effectOptions"]
>;

const base = hyperspeedDefaultPreset;

/**
 * Hero backdrop: default turbulent scene with lane markings **white** and Helvety-style
 * **red** tail lights vs **bright / white** “headlight” streaks; side sticks read as white glow.
 * Keeps default variation safety rails, with a slightly stronger intensity for visible
 * per-session uniqueness.
 */
export const HERO_HYPERSPEED_EFFECT_OPTIONS = {
  ...base,
  variation: {
    ...base.variation,
    intensity: 0.42,
    reseedIntervalMs: 3000,
  },
  colors: {
    ...base.colors,
    shoulderLines: 0xffffff,
    brokenLines: 0xffffff,
    leftCars: [0xff102a, 0xe31b2b, 0xff3344],
    rightCars: [0xf5f5f5, 0xffffff, 0xffe8e8],
    sticks: 0xffffff,
  },
} as unknown as HyperspeedEffectOptions;
