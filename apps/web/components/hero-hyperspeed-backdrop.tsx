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
 * Black base + opacity fade-in after first WebGL frame ({@link Hyperspeed} `onReady`).
 * Chunk load shows the same black placeholder from `next/dynamic` `loading`.
 */
export function HeroHyperspeedBackdrop() {
  const [canvasReady, setCanvasReady] = useState(false);
  const handleReady = useCallback(() => {
    requestAnimationFrame(() => {
      setCanvasReady(true);
    });
  }, []);

  return (
    <>
      <div aria-hidden className="absolute inset-0 z-0 bg-black" />
      <div
        className={cn(
          "absolute inset-0 z-[1] h-full min-h-0 w-full",
          "transition-opacity duration-500 ease-out",
          canvasReady
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
          "motion-reduce:opacity-100 motion-reduce:transition-none"
        )}
      >
        <HeroHyperspeed
          effectOptions={HERO_HYPERSPEED_EFFECT_OPTIONS}
          onReady={handleReady}
        />
      </div>
    </>
  );
}
