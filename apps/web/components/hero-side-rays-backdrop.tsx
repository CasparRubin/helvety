"use client";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";
import { cn } from "@helvety/shared/utils";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const HeroSideRays = createHelvetyWebglDynamic(
  () => import("@/components/vendor/SideRays"),
  "hero-side-rays-loading"
);

/** Helvety brand red + white rays from the top-right corner. */
const HERO_SIDE_RAYS_PROPS = {
  speed: 2.5,
  rayColor1: "#F43F5E",
  rayColor2: "#ffffff",
  intensity: 2,
  spread: 2,
  origin: "top-right" as const,
  tilt: 0,
  saturation: 1.5,
  blend: 0.75,
  falloff: 1.6,
  opacity: 1,
};

/**
 * SideRays WebGL inside a reveal wrapper: hidden until the first composited
 * frame (`onReady`), then fades in over 2000ms. Remounts after bfcache restore.
 */
export function HeroSideRaysBackdrop() {
  const clientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [revealed, setRevealed] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  const handleReady = useCallback(() => {
    scheduleWebglBackdropReady(() => {
      setRevealed(true);
    });
  }, []);

  const handleInitError = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[hero-side-rays] init_failed");
    }
    setRevealed(false);
  }, []);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setRevealed(false);
        setRemountKey((key) => key + 1);
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <div
      aria-hidden
      data-testid="hero-side-rays-reveal"
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
          <HeroSideRays
            key={remountKey}
            {...HERO_SIDE_RAYS_PROPS}
            onReady={handleReady}
            onInitError={handleInitError}
          />
        ) : null}
      </div>
    </div>
  );
}
