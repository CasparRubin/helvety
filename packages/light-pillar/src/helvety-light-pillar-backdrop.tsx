"use client";

import { useCallback } from "react";

import { createHelvetyWebglDynamic } from "./create-helvety-webgl-dynamic";
import { HELVETY_LIGHT_PILLAR_OPTIONS } from "./helvety-light-pillar-preset";
import {
  scheduleWebglBackdropReady,
  WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS,
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
 * WebGL pillar layer (red/white). Parent shell keeps the fixed host at `opacity-0` until `onReady`.
 * Local black underlay (and dynamic `loading` slot) prevent transparent-canvas flash inside the WebGL
 * host only—not a veil over shell content. The web gateway hero uses a local veil inside its
 * bleed host (`apps/web` `hero-hyperspeed-backdrop.tsx`), not over the public shell UI.
 */
export function HelvetyLightPillarBackdrop({
  onReady,
}: HelvetyLightPillarBackdropProps) {
  const handleReady = useCallback(() => {
    scheduleWebglBackdropReady(() => {
      onReady?.();
    });
  }, [onReady]);

  return (
    <>
      <div aria-hidden className={WEBGL_BACKDROP_BLACK_UNDERLAY_CLASS} />
      <div
        className="absolute inset-0 z-[1] h-full min-h-0 w-full"
        data-testid="helvety-light-pillar-host"
      >
        <HelvetyLightPillar
          {...HELVETY_LIGHT_PILLAR_OPTIONS}
          className="h-full w-full"
          onReady={handleReady}
        />
      </div>
    </>
  );
}
