/**
 * Custom hook for checking PDF worker rendering availability.
 * Determines if the browser supports the required rendering primitives
 * for optimized worker-based PDF rendering.
 */

import * as React from "react";

import { getRenderingCapabilities } from "@/lib/feature-detection";

/** Cached capabilities: probing WebGL creates canvases/contexts, so do it once. */
let cachedCapabilities: ReturnType<typeof getRenderingCapabilities> | null =
  null;

/** Returns browser rendering capabilities, probing only on first use. */
function getCachedRenderingCapabilities() {
  if (typeof window === "undefined") {
    return getRenderingCapabilities();
  }
  cachedCapabilities ??= getRenderingCapabilities();
  return cachedCapabilities;
}

/**
 * Return type for usePdfRendering hook.
 */
interface UsePdfRenderingReturn {
  /** Whether worker rendering is available with required browser capabilities */
  isWorkerRenderingAvailable: boolean;
}

/**
 * Custom hook that checks browser rendering capabilities for PDF pages.
 *
 * @returns Whether worker-based rendering is available
 */
export function usePdfRendering(): UsePdfRenderingReturn {
  const capabilities = React.useMemo(
    () => getCachedRenderingCapabilities(),
    []
  );

  return {
    isWorkerRenderingAvailable: capabilities.canUseWorkerRendering,
  };
}
