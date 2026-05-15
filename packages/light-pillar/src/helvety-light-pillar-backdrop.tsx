"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { HELVETY_LIGHT_PILLAR_OPTIONS } from "./helvety-light-pillar-preset";

const HelvetyLightPillar = dynamic(() => import("./LightPillar"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="absolute inset-0 bg-black"
      data-testid="helvety-light-pillar-loading"
    />
  ),
});

/** Props for {@link HelvetyLightPillarBackdrop}. */
type HelvetyLightPillarBackdropProps = {
  /** Fires once after the first composited WebGL frame (or when WebGL is unavailable). */
  onReady?: () => void;
};

/**
 * WebGL pillar layer (red/white). Parent shell keeps the fixed host at `opacity-0` until `onReady`.
 * Local black underlay (and dynamic `loading` slot) prevent transparent-canvas flash inside the WebGL
 * host only—not a viewport veil over shell content (unlike `apps/web` Hyperspeed hero).
 */
export function HelvetyLightPillarBackdrop({
  onReady,
}: HelvetyLightPillarBackdropProps) {
  const handleReady = useCallback(() => {
    requestAnimationFrame(() => {
      onReady?.();
    });
  }, [onReady]);

  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-black" />
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
