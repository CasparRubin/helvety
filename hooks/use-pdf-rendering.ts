/**
 * Custom hook for managing PDF page rendering using Web Workers and ImageBitmap.
 * Provides optimized rendering with OffscreenCanvas and ImageBitmap caching.
 */

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { IMAGEBITMAP_CACHE } from "@/lib/constants";
import { getRenderingCapabilities } from "@/lib/feature-detection";
import { getImageBitmapCache, generateCacheKey } from "@/lib/imagebitmap-cache";
import { logger } from "@/lib/logger";

/**
 * Result of a render operation.
 */
interface RenderResult {
  /** The rendered ImageBitmap */
  imageBitmap: ImageBitmap | null;
  /** Error message if rendering failed */
  error: string | null;
  /** Whether the render was cancelled */
  cancelled: boolean;
}

/**
 * Parameters for rendering a PDF page.
 */
interface RenderParams {
  /** PDF file URL */
  fileUrl: string;
  /** Page number (1-based) */
  pageNumber: number;
  /** Render width in pixels */
  width: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Rotation angle in degrees */
  rotation: number;
}

/**
 * Return type for usePdfRendering hook.
 */
interface UsePdfRenderingReturn {
  /** Renders a PDF page and returns ImageBitmap */
  renderPage: (params: RenderParams) => Promise<RenderResult>;
  /** Cancels an ongoing render operation */
  cancelRender: (id: string) => void;
  /** Whether worker rendering is available */
  isWorkerRenderingAvailable: boolean;
  /** Clears the ImageBitmap cache */
  clearCache: () => void;
}

/**
 * Custom hook for PDF page rendering with worker support.
 *
 * @returns Rendering functions and state
 */
export function usePdfRendering(): UsePdfRenderingReturn {
  const isMobile = useIsMobile();
  const [cache] = React.useState(() => {
    const maxSize = isMobile
      ? IMAGEBITMAP_CACHE.MOBILE_MAX_CACHED_IMAGES
      : IMAGEBITMAP_CACHE.MAX_CACHED_IMAGES;
    const maxMemory = isMobile
      ? IMAGEBITMAP_CACHE.MOBILE_MAX_MEMORY_BYTES
      : IMAGEBITMAP_CACHE.MAX_MEMORY_BYTES;
    return getImageBitmapCache(maxSize, maxMemory);
  });

  const capabilities = React.useMemo(() => getRenderingCapabilities(), []);
  const activeRendersRef = React.useRef<Map<string, AbortController>>(
    new Map()
  );

  /**
   * Checks cache for a rendered PDF page ImageBitmap.
   *
   * Note: This hook currently only provides cache lookup functionality.
   * The actual PDF rendering is handled by react-pdf in PdfPageThumbnail.
   * Canvas-to-ImageBitmap conversion and worker-based rendering are not implemented.
   */
  const renderPage = React.useCallback(
    async (params: RenderParams): Promise<RenderResult> => {
      const { fileUrl, pageNumber, width, devicePixelRatio, rotation } = params;

      // Generate cache key
      const cacheKey = generateCacheKey(
        fileUrl,
        pageNumber,
        width,
        devicePixelRatio,
        rotation
      );

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.log(`Cache hit for page ${pageNumber}`);
        return {
          imageBitmap: cached,
          error: null,
          cancelled: false,
        };
      }

      // No cached ImageBitmap found; PdfPageThumbnail will use react-pdf canvas rendering

      if (!capabilities.imageBitmap || !capabilities.createImageBitmap) {
        return {
          imageBitmap: null,
          error: "ImageBitmap not supported",
          cancelled: false,
        };
      }

      // ImageBitmap not supported; fall back to canvas rendering
      return {
        imageBitmap: null,
        error: "Use canvas rendering first, then convert",
        cancelled: false,
      };
    },
    [cache, capabilities]
  );

  /**
   * Cancels an ongoing render operation.
   *
   * @param id - The render operation ID to cancel
   */
  const cancelRender = React.useCallback((id: string): void => {
    const controller = activeRendersRef.current.get(id);
    if (controller) {
      controller.abort();
      activeRendersRef.current.delete(id);
    }
  }, []);

  /**
   * Clears the ImageBitmap cache.
   */
  const clearCache = React.useCallback(() => {
    cache.clear();
  }, [cache]);

  // Cleanup on unmount
  React.useEffect(() => {
    const activeRenders = activeRendersRef.current;
    return () => {
      // Cancel all active renders
      for (const [, controller] of activeRenders) {
        controller.abort();
      }
      activeRenders.clear();
    };
  }, []);

  return {
    renderPage,
    cancelRender,
    isWorkerRenderingAvailable: capabilities.canUseWorkerRendering,
    clearCache,
  };
}
