import type LightPillar from "@/components/LightPillar";
import type { ComponentProps } from "react";

/** Props shape accepted by {@link LightPillar} for the store preset. */
type StoreLightPillarOptions = ComponentProps<typeof LightPillar>;

/**
 * Store shell preset: React Bits Light Pillar template tuning with Helvety colors only.
 * Matches the integration snippet (1080×1080 demo) except colors: white top, saturated
 * Helvety red base (`#ff102a`, same vivid red as web Hyperspeed tail lights).
 * Does not set `mixBlendMode` or `quality` (component defaults: `screen`, `high`).
 * Mounting is fixed full-viewport via {@link ./store-shell-with-backdrop.tsx} and
 * {@link ./store-light-pillar-backdrop.tsx}.
 */
export const STORE_LIGHT_PILLAR_OPTIONS = {
  topColor: "#ffffff",
  bottomColor: "#ff102a",
  intensity: 1,
  rotationSpeed: 0.3,
  interactive: false,
  glowAmount: 0.002,
  pillarWidth: 3,
  pillarHeight: 0.2,
  noiseIntensity: 0.5,
  pillarRotation: 25,
} satisfies StoreLightPillarOptions;
