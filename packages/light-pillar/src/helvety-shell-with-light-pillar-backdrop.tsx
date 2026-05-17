"use client";

import { cn } from "@helvety/shared/utils";
import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import { useIsMobile } from "@helvety/ui/use-is-mobile";
import { useCallback, useEffect, useState } from "react";

import { HelvetyLightPillarBackdrop } from "./helvety-light-pillar-backdrop";
import { waitForShellContentPainted } from "./wait-for-shell-content-painted";
import { WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS } from "./webgl-backdrop";

import type { ReactNode } from "react";

/** Reads `prefers-reduced-motion: reduce` on the client; false during SSR. */
function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribes to `prefers-reduced-motion` changes after mount. */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    readPrefersReducedMotion
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Wraps a public app shell on all routes. Shell content always paints on `bg-background`.
 * On **md+** viewports (≥768px, `useIsMobile`) in **dark** mode, WebGL loads after double rAF
 * and the pillar fades in when ready (`opacity-0` → `opacity-100`, 700ms ease-out). Below **md**,
 * in **light** mode, or when `prefers-reduced-motion: reduce` is set, WebGL is not mounted; a
 * static `bg-background` layer is shown instead (`max-md:block` for SSR-safe mobile, plus JS/CSS).
 */
export function HelvetyShellWithLightPillarBackdrop({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const isDark = useHtmlDarkTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipWebglBackdrop = prefersReducedMotion || isMobile || !isDark;

  const [shellPainted, setShellPainted] = useState(false);
  const [pillarReady, setPillarReady] = useState(false);

  useEffect(() => {
    if (skipWebglBackdrop) {
      setShellPainted(false);
      setPillarReady(false);
      return;
    }

    let cancelled = false;
    void waitForShellContentPainted().then(() => {
      if (!cancelled) {
        setShellPainted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [skipWebglBackdrop]);

  const handlePillarReady = useCallback(() => {
    setPillarReady(true);
  }, []);

  const revealed = shellPainted && pillarReady;

  return (
    <div className="relative isolate min-h-svh">
      {shellPainted ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed inset-0 z-0 motion-reduce:hidden",
            "opacity-0",
            WEBGL_BACKDROP_REVEAL_TRANSITION_CLASS,
            revealed && "opacity-100"
          )}
          data-testid="helvety-shell-light-pillar-fixed-host"
        >
          <HelvetyLightPillarBackdrop onReady={handlePillarReady} />
        </div>
      ) : null}
      {/* Static fallback: compact viewports, light mode, and reduced motion. */}
      <div
        aria-hidden
        className={cn(
          "bg-background absolute inset-0 z-0",
          "max-md:block",
          skipWebglBackdrop ? "md:block" : "md:hidden",
          "motion-reduce:block"
        )}
        data-testid="helvety-shell-light-pillar-reduce-fallback"
      />
      <div
        className="relative z-10"
        data-testid="helvety-shell-light-pillar-content"
      >
        {children}
      </div>
    </div>
  );
}
