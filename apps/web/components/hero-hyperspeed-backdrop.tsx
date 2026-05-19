"use client";

import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
  WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
} from "@helvety/light-pillar";
import { createHelvetyWebglDynamic } from "@helvety/light-pillar/webgl-dynamic";
import { cn } from "@helvety/shared/utils";
import {
  readHtmlDarkTheme,
  useHtmlDarkTheme,
} from "@helvety/ui/use-html-dark-theme";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { isGatewayCrossZoneHref } from "@/components/hero-hyperspeed-navigation";
import { getHeroHyperspeedEffectOptions } from "@/components/hero-hyperspeed-options";

const HeroHyperspeed = createHelvetyWebglDynamic(
  () => import("@/components/vendor/Hyperspeed"),
  "hero-hyperspeed-loading"
);

/** Never mount light WebGL clears when `html.dark` is already set. */
function resolveEffectIsDark(isDark: boolean): boolean {
  if (typeof document !== "undefined") {
    if (document.documentElement.classList.contains("dark")) {
      return true;
    }
  }
  return isDark;
}

/**
 * Semantic base + Hyperspeed WebGL inside a reveal wrapper that stays at
 * `opacity-0` until the first composited frame (`onReady` →
 * {@link scheduleWebglBackdropReady}), then fades in over **700ms**.
 * Theme toggle hides the wrapper, remounts Hyperspeed (`key`), and fades in again.
 * Hides immediately on cross-zone navigation, `pagehide`, and bfcache restore.
 */
export function HeroHyperspeedBackdrop() {
  const isDark = useHtmlDarkTheme();
  const clientMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [themeStable, setThemeStable] = useState(false);
  const effectIsDark = resolveEffectIsDark(isDark);
  const effectOptions = useMemo(
    () => getHeroHyperspeedEffectOptions(effectIsDark),
    [effectIsDark]
  );
  const [revealed, setRevealed] = useState(false);
  const readyGeneration = useRef(0);

  useLayoutEffect(() => {
    setThemeStable(true);
  }, []);

  useLayoutEffect(() => {
    setRevealed(false);
    readyGeneration.current += 1;
  }, [isDark]);

  const hideReveal = useCallback(() => {
    setRevealed(false);
    readyGeneration.current += 1;
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      hideReveal();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hideReveal();
      }
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        hideReveal();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (href && isGatewayCrossZoneHref(href)) {
        hideReveal();
      }
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [hideReveal]);

  const handleReady = useCallback(() => {
    const gen = readyGeneration.current;
    scheduleWebglBackdropReady(() => {
      if (gen !== readyGeneration.current) {
        return;
      }
      if (readHtmlDarkTheme() !== isDark) {
        readyGeneration.current += 1;
        setRevealed(false);
        return;
      }
      setRevealed(true);
    });
  }, [isDark]);

  const canMountGl = clientMounted && themeStable;

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
        {canMountGl ? (
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
