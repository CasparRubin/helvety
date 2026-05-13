"use client";

import { cn } from "@helvety/shared/utils";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { HERO_HYPERSPEED_EFFECT_OPTIONS } from "@/components/hero-hyperspeed-options";

const HeroHyperspeed = dynamic(() => import("@/components/Hyperspeed"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="absolute inset-0 bg-black"
      data-testid="hero-hyperspeed-loading"
    />
  ),
});

/**
 * Black base, then **black veil** fades out after first WebGL frame (`onReady`).
 * WebGL stays at full opacity underneath so transparent canvas / bloom never flashes
 * the page background (fading the canvas layer in caused white flashes with `alpha: true`).
 */
export function HeroHyperspeedBackdrop() {
  const [veilHidden, setVeilHidden] = useState(false);
  const handleReady = useCallback(() => {
    requestAnimationFrame(() => {
      setVeilHidden(true);
    });
  }, []);

  return (
    <>
      <div aria-hidden className="absolute inset-0 z-0 bg-black" />
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
            "pointer-events-none transition-opacity duration-500 ease-out motion-reduce:transition-none",
            veilHidden ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    </>
  );
}
