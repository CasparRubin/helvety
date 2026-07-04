"use client";

import { useEffect, useState } from "react";

/** Scale factor that fits `logicalWidth`×`logicalHeight` into the container (never upscales past 1). */
export function useStageFit(
  containerRef: React.RefObject<HTMLElement | null>,
  logicalWidth: number,
  logicalHeight: number
): number {
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || logicalWidth <= 0 || logicalHeight <= 0) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      const padding = 16;
      const availableWidth = Math.max(1, rect.width - padding * 2);
      const availableHeight = Math.max(1, rect.height - padding * 2);
      const scale = Math.min(
        availableWidth / logicalWidth,
        availableHeight / logicalHeight,
        1
      );
      setFitScale(scale);
    };

    update();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, logicalWidth, logicalHeight]);

  return fitScale;
}
