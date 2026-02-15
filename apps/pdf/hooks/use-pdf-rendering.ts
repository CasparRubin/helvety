/**
 * Custom hook for checking PDF worker rendering availability.
 * Determines if the browser supports OffscreenCanvas + ImageBitmap
 * for optimized worker-based PDF rendering.
 */

import * as React from "react";

import { getRenderingCapabilities } from "@/lib/feature-detection";

/**
 * Return type for usePdfRendering hook.
 */
interface UsePdfRenderingReturn {
  /** Whether worker rendering is available (requires OffscreenCanvas + ImageBitmap) */
  isWorkerRenderingAvailable: boolean;
}

/**
 * Custom hook that checks browser rendering capabilities for PDF pages.
 *
 * @returns Whether worker-based rendering is available
 */
export function usePdfRendering(): UsePdfRenderingReturn {
  const capabilities = React.useMemo(() => getRenderingCapabilities(), []);

  return {
    isWorkerRenderingAvailable: capabilities.canUseWorkerRendering,
  };
}
