"use client";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";
import { cn } from "@helvety/shared/utils";
import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getHeroHyperspeedEffectOptions } from "@/components/hero-hyperspeed-options";

const HeroHyperspeed = createHelvetyWebglDynamic(
  () => import("@/components/vendor/Hyperspeed"),
  "hero-hyperspeed-loading"
);

/**
 * Semantic base, then a **local veil** (inside the hero bleed host) fades out over **700ms**
 * after the first composited WebGL frame (`onReady` → {@link scheduleWebglBackdropReady}).
 * WebGL stays at full opacity underneath so transparent canvas / bloom never flashes
 * the page background. Veil resets when theme changes (Hyperspeed remounts via `key` + preset swap).
 */
export function HeroHyperspeedBackdrop() {
  const isDark = useHtmlDarkTheme();
  const effectOptions = useMemo(
    () => getHeroHyperspeedEffectOptions(isDark),
    [isDark]
  );
  const [veilHidden, setVeilHidden] = useState(false);

  useEffect(() => {
    setVeilHidden(false);
  }, [isDark]);

  const handleReady = useCallback(() => {
    scheduleWebglBackdropReady(() => {
      setVeilHidden(true);
    });
  }, []);

  return (
    <>
      <div aria-hidden className={WEBGL_BACKDROP_UNDERLAY_CLASS} />
      <div className="absolute inset-0 z-[1] h-full min-h-0 w-full">
        <HeroHyperspeed
          key={isDark ? "dark" : "light"}
          effectOptions={effectOptions}
          onReady={handleReady}
        />
        <div
          aria-hidden
          data-testid="hero-hyperspeed-veil"
          className={cn(
            "bg-background absolute inset-0 z-[2]",
            "pointer-events-none",
            WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
            veilHidden ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    </>
  );
}
