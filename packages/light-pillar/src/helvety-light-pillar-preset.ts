import { HELVETY_ACCENT_RED } from "@helvety/brand";

import type LightPillar from "./LightPillar";
import type { ComponentProps } from "react";

/** Props shape accepted by {@link LightPillar} for the Helvety shell preset. */
type HelvetyLightPillarOptions = ComponentProps<typeof LightPillar>;

/**
 * Helvety shell preset: React Bits Light Pillar template tuning with Helvety colors only.
 * White top, saturated red base ({@link HELVETY_ACCENT_RED}, same vivid red as web Hyperspeed tail lights).
 * Does not set `mixBlendMode` or `quality` (component defaults: `screen`, `high`).
 */
export const HELVETY_LIGHT_PILLAR_OPTIONS = {
  topColor: "#ffffff",
  bottomColor: HELVETY_ACCENT_RED,
  intensity: 1,
  rotationSpeed: 0.3,
  interactive: false,
  glowAmount: 0.002,
  pillarWidth: 3,
  pillarHeight: 0.2,
  noiseIntensity: 0.5,
  pillarRotation: 25,
} satisfies HelvetyLightPillarOptions;
