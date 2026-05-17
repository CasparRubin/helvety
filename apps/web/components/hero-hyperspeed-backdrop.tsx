"use client";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS,
  WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";
import { cn } from "@helvety/shared/utils";
import { useCallback, useState } from "react";

import { HERO_HYPERSPEED_EFFECT_OPTIONS } from "@/components/hero-hyperspeed-options";

const HeroHyperspeed = createHelvetyWebglDynamic(
  () => import("@/components/Hyperspeed"),
  "hero-hyperspeed-loading"
);

/**
 * Black base, then a **local black veil** (inside the hero bleed host) fades out over **700ms**
 * after the first composited WebGL frame (`onReady` → {@link scheduleWebglBackdropReady}).
 * WebGL stays at full opacity underneath so transparent canvas / bloom never flashes
 * the page background (fading the canvas layer in caused white flashes with `alpha: true`).
 * Shared helpers: `@helvety/light-pillar` (underlay, reveal); `@helvety/light-pillar/webgl-dynamic` (dynamic import).
 * Parent {@link HeroSection} mounts this only in dark mode (not light / reduced motion).
 */
export function HeroHyperspeedBackdrop() {
  const [veilHidden, setVeilHidden] = useState(false);
  const handleReady = useCallback(() => {
    scheduleWebglBackdropReady(() => {
      setVeilHidden(true);
    });
  }, []);

  return (
    <>
      <div aria-hidden className={WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS} />
      <div className="absolute inset-0 z-[1] h-full min-h-0 w-full">
        <HeroHyperspeed
          effectOptions={HERO_HYPERSPEED_EFFECT_OPTIONS}
          onReady={handleReady}
        />
        <div
          aria-hidden
          data-testid="hero-hyperspeed-veil"
          className={cn(
            "absolute inset-0 z-[2] bg-black",
            "pointer-events-none",
            WEBGL_BACKDROP_VEIL_REVEAL_TRANSITION_CLASS,
            veilHidden ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    </>
  );
}
