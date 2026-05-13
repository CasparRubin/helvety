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
 * Matches default variation rails; **longer** reseed interval so the road shape changes
 * less often on the landing hero.
 */
export const HERO_HYPERSPEED_EFFECT_OPTIONS = {
  ...base,
  variation: {
    ...base.variation,
    intensity: 0.26,
    reseedIntervalMs: 4200,
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
