"use client";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";
import { cn } from "@helvety/shared/utils";
import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { getHeroHyperspeedEffectOptions } from "@/components/hero-hyperspeed-options";

const HeroHyperspeed = createHelvetyWebglDynamic(
  () => import("@/components/vendor/Hyperspeed"),
  "hero-hyperspeed-loading"
);

/**
 * Semantic base + Hyperspeed WebGL inside a reveal wrapper that stays at
 * `opacity-0` until the first composited frame (`onReady` →
 * {@link scheduleWebglBackdropReady}), then fades in over **700ms**.
 * Theme toggle hides the wrapper, remounts Hyperspeed (`key`), and fades in again.
 */
export function HeroHyperspeedBackdrop() {
  const isDark = useHtmlDarkTheme();
  const clientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const effectOptions = useMemo(
    () => getHeroHyperspeedEffectOptions(isDark),
    [isDark]
  );
  const [revealed, setRevealed] = useState(false);
  const readyGeneration = useRef(0);

  useLayoutEffect(() => {
    setRevealed(false);
    readyGeneration.current += 1;
  }, [isDark]);

  const handleReady = useCallback(() => {
    const gen = readyGeneration.current;
    scheduleWebglBackdropReady(() => {
      if (gen === readyGeneration.current) {
        setRevealed(true);
      }
    });
  }, []);

  return (
    <div
      aria-hidden
      data-testid="hero-hyperspeed-reveal"
      className={cn(
        "absolute inset-0",
        WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
        revealed ? "opacity-100" : "opacity-0",
        !revealed && "pointer-events-none"
      )}
    >
      <div className={WEBGL_BACKDROP_UNDERLAY_CLASS} />
      <div className="absolute inset-0 z-[1] h-full min-h-0 w-full">
        {clientMounted ? (
          <HeroHyperspeed
            key={isDark ? "dark" : "light"}
            effectOptions={effectOptions}
            onReady={handleReady}
          />
        ) : null}
      </div>
    </div>
  );
}
