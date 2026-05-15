"use client";

import { cn } from "@helvety/shared/utils";
import { useCallback, useEffect, useState } from "react";

import { HelvetyLightPillarBackdrop } from "./helvety-light-pillar-backdrop";
import { LIGHT_PILLAR_REVEAL_TRANSITION_CLASS } from "./light-pillar-reveal";
import { waitForShellContentPainted } from "./wait-for-shell-content-painted";

import type { ReactNode } from "react";

/**
 * Wraps a public app shell with a fixed Light Pillar backdrop on all routes.
 * Shell content paints first on `bg-background`; WebGL loads after double rAF, then
 * the backdrop fades in when the pillar is ready (`opacity-0` → `opacity-100`, 700ms ease-out).
 * `prefers-reduced-motion: reduce`: no WebGL, static `bg-background` fallback only.
 */
export function HelvetyShellWithLightPillarBackdrop({
  children,
}: {
  children: ReactNode;
}) {
  const [shellPainted, setShellPainted] = useState(false);
  const [pillarReady, setPillarReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, []);

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
            LIGHT_PILLAR_REVEAL_TRANSITION_CLASS,
            revealed && "opacity-100"
          )}
          data-testid="helvety-shell-light-pillar-fixed-host"
        >
          <HelvetyLightPillarBackdrop onReady={handlePillarReady} />
        </div>
      ) : null}
      <div
        aria-hidden
        className="bg-background absolute inset-0 z-0 hidden motion-reduce:block"
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
