"use client";

import * as React from "react";

import { THUMBNAIL_DIMENSIONS } from "@/lib/constants";
import { debounce } from "@/lib/pdf-helpers";

/** Options for thumbnail layout measurement hook. */
type UseThumbnailLayoutOptions = {
  calculateDPR: (containerWidth: number) => number;
};

/** Measures thumbnail width and computes a matching DPR. */
export function useThumbnailLayout({
  calculateDPR,
}: UseThumbnailLayoutOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = React.useState<number>(400);
  const [devicePixelRatio, setDevicePixelRatio] = React.useState(1.0);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** Recompute constrained width and derived DPR for thumbnail rendering. */
    const updateWidth = (): void => {
      const rect = container.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(container);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;

      const availableWidth =
        rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
      const calculatedWidth = Math.max(
        THUMBNAIL_DIMENSIONS.MIN_WIDTH,
        Math.min(availableWidth, THUMBNAIL_DIMENSIONS.MAX_WIDTH)
      );

      setPageWidth(calculatedWidth);
      setDevicePixelRatio(calculateDPR(calculatedWidth));
    };

    updateWidth();

    const debouncedUpdateWidth = debounce(updateWidth, 150);
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        debouncedUpdateWidth();
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", debouncedUpdateWidth);
    }

    return (): void => {
      debouncedUpdateWidth.cancel();
      if (resizeObserver) {
        resizeObserver.disconnect();
        return;
      }
      window.removeEventListener("resize", debouncedUpdateWidth);
    };
  }, [calculateDPR]);

  return {
    containerRef,
    pageWidth,
    devicePixelRatio,
  };
}
