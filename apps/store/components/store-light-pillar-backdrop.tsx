"use client";

import { cn } from "@helvety/shared/utils";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { STORE_LIGHT_PILLAR_OPTIONS } from "@/components/store-light-pillar-options";

const StoreLightPillar = dynamic(() => import("@/components/LightPillar"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="absolute inset-0 bg-black"
      data-testid="store-light-pillar-loading"
    />
  ),
});

/**
 * Fixed shell backdrop: black base, WebGL pillar (red/white), black veil fades after
 * the first composited frame. Reduced motion is handled by {@link ./store-shell-with-backdrop.tsx}.
 */
export function StoreLightPillarBackdrop() {
  const [veilHidden, setVeilHidden] = useState(false);
  const handleReady = useCallback(() => {
    requestAnimationFrame(() => {
      setVeilHidden(true);
    });
  }, []);

  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 z-[1] h-full min-h-0 w-full"
        data-testid="store-light-pillar-host"
      >
        <StoreLightPillar
          {...STORE_LIGHT_PILLAR_OPTIONS}
          className="h-full w-full"
          onReady={handleReady}
        />
        <div
          aria-hidden
          data-testid="store-light-pillar-veil"
          className={cn(
            "absolute inset-0 z-[2] bg-black",
            "pointer-events-none transition-opacity duration-500 ease-out motion-reduce:transition-none",
            veilHidden ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    </>
  );
}
