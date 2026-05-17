"use client";

import { useHtmlDarkTheme } from "@helvety/ui/use-html-dark-theme";
import { useCallback, useMemo } from "react";

import { createHelvetyWebglDynamic } from "./create-helvety-webgl-dynamic";
import { getHelvetyLightPillarOptions } from "./helvety-light-pillar-preset";
import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_UNDERLAY_CLASS,
} from "./webgl-backdrop";

const HelvetyLightPillar = createHelvetyWebglDynamic(
  () => import("./LightPillar"),
  "helvety-light-pillar-loading"
);

/** Props for {@link HelvetyLightPillarBackdrop}. */
type HelvetyLightPillarBackdropProps = {
  /** Fires once after the first composited WebGL frame (or when WebGL is unavailable). */
  onReady?: () => void;
};

/**
 * WebGL pillar layer (white/red or black/red). Parent shell keeps the fixed host at `opacity-0` until `onReady`.
 * Semantic `bg-background` underlay (and dynamic `loading` slot) prevent transparent-canvas flash inside the WebGL
 * host only—not a veil over shell content. The web gateway hero uses a local veil inside its
 * bleed host (`apps/web` `hero-hyperspeed-backdrop.tsx`), not over the public shell UI.
 */
export function HelvetyLightPillarBackdrop({
  onReady,
}: HelvetyLightPillarBackdropProps) {
  const isDark = useHtmlDarkTheme();
  const pillarOptions = useMemo(
    () => getHelvetyLightPillarOptions(isDark),
    [isDark]
  );

  const handleReady = useCallback(() => {
    scheduleWebglBackdropReady(() => {
      onReady?.();
    });
  }, [onReady]);

  return (
    <>
      <div aria-hidden className={WEBGL_BACKDROP_UNDERLAY_CLASS} />
      <div
        className="absolute inset-0 z-[1] h-full min-h-0 w-full"
        data-testid="helvety-light-pillar-host"
      >
        <HelvetyLightPillar
          {...pillarOptions}
          className="h-full w-full"
          onReady={handleReady}
        />
      </div>
    </>
  );
}
