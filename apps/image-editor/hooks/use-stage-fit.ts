"use client";

import { useLayoutEffect, useState } from "react";

/** Scale factor that fits the full logical stage into the container (never upscales past 1). */
export function useStageFit(
  containerRef: React.RefObject<HTMLElement | null>,
  logicalWidth: number,
  logicalHeight: number
): number {
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || logicalWidth <= 0 || logicalHeight <= 0) {
      return;
    }

    const update = () => {
      // Measure the content box: `clientWidth`/`clientHeight` exclude borders
      // and scrollbars, then subtract the container's padding.
      const style = getComputedStyle(element);
      const paddingX =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      const paddingY =
        Number.parseFloat(style.paddingTop) +
        Number.parseFloat(style.paddingBottom);
      const availableWidth = Math.max(1, element.clientWidth - paddingX);
      const availableHeight = Math.max(1, element.clientHeight - paddingY);
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
