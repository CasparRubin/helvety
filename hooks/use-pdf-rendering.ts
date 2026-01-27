/**
 * Custom hook for managing PDF page rendering using Web Workers and ImageBitmap.
 * Provides optimized rendering with OffscreenCanvas and ImageBitmap caching.
 */

import * as React from "react"
import { logger } from "@/lib/logger"
import { getImageBitmapCache, generateCacheKey } from "@/lib/imagebitmap-cache"
import { getRenderingCapabilities } from "@/lib/feature-detection"
import { IMAGEBITMAP_CACHE } from "@/lib/constants"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Result of a render operation.
 */
interface RenderResult {
  /** The rendered ImageBitmap */
  imageBitmap: ImageBitmap | null
  /** Error message if rendering failed */
  error: string | null
  /** Whether the render was cancelled */
  cancelled: boolean
}

/**
 * Parameters for rendering a PDF page.
 */
interface RenderParams {
  /** PDF file URL */
  fileUrl: string
  /** Page number (1-based) */
  pageNumber: number
  /** Render width in pixels */
  width: number
  /** Device pixel ratio */
  devicePixelRatio: number
  /** Rotation angle in degrees */
  rotation: number
}

/**
 * Return type for usePdfRendering hook.
 */
interface UsePdfRenderingReturn {
  /** Renders a PDF page and returns ImageBitmap */
  renderPage: (params: RenderParams) => Promise<RenderResult>
  /** Cancels an ongoing render operation */
  cancelRender: (id: string) => void
  /** Whether worker rendering is available */
  isWorkerRenderingAvailable: boolean
  /** Clears the ImageBitmap cache */
  clearCache: () => void
}

/**
 * Custom hook for PDF page rendering with worker support.
 * 
 * @returns Rendering functions and state
 */
export function usePdfRendering(): UsePdfRenderingReturn {
  const isMobile = useIsMobile()
  const [cache] = React.useState(() => {
    const maxSize = isMobile 
      ? IMAGEBITMAP_CACHE.MOBILE_MAX_CACHED_IMAGES 
      : IMAGEBITMAP_CACHE.MAX_CACHED_IMAGES
    const maxMemory = isMobile
      ? IMAGEBITMAP_CACHE.MOBILE_MAX_MEMORY_BYTES
      : IMAGEBITMAP_CACHE.MAX_MEMORY_BYTES
    return getImageBitmapCache(maxSize, maxMemory)
  })

  const capabilities = React.useMemo(() => getRenderingCapabilities(), [])
  const activeRendersRef = React.useRef<Map<string, AbortController>>(new Map())

  /**
   * Renders a PDF page to ImageBitmap using canvas rendering (main thread).
   * 
   * Note: This requires the page to be rendered to a canvas first (via react-pdf),
   * then we convert that canvas to ImageBitmap. The actual PDF rendering still uses
   * react-pdf, but we cache the result as ImageBitmap for better performance.
   * 
   * Worker-based rendering is not currently implemented. The infrastructure exists
   * but PDF.js integration in workers requires additional complexity.
   */
  const renderPage = React.useCallback(async (params: RenderParams): Promise<RenderResult> => {
    const { fileUrl, pageNumber, width, devicePixelRatio, rotation } = params
    
    // Generate cache key
    const cacheKey = generateCacheKey(fileUrl, pageNumber, width, devicePixelRatio, rotation)
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      logger.log(`Cache hit for page ${pageNumber}`)
      return {
        imageBitmap: cached,
        error: null,
        cancelled: false,
      }
    }

    // Return null to use the existing react-pdf canvas rendering
    // The ImageBitmap conversion will happen after the canvas is rendered
    // This is handled in the PdfPageThumbnail component
    
    if (!capabilities.imageBitmap || !capabilities.createImageBitmap) {
      return {
        imageBitmap: null,
        error: 'ImageBitmap not supported',
        cancelled: false,
      }
    }

    // Return null to indicate we should use canvas rendering, then convert to ImageBitmap
    // The actual conversion happens in the component after canvas renders
    return {
      imageBitmap: null,
      error: 'Use canvas rendering first, then convert',
      cancelled: false,
    }
  }, [cache, capabilities])

  /**
   * Cancels an ongoing render operation.
   * 
   * @param id - The render operation ID to cancel
   */
  const cancelRender = React.useCallback((id: string): void => {
    const controller = activeRendersRef.current.get(id)
    if (controller) {
      controller.abort()
      activeRendersRef.current.delete(id)
    }
  }, [])

  /**
   * Clears the ImageBitmap cache.
   */
  const clearCache = React.useCallback(() => {
    cache.clear()
  }, [cache])

  // Cleanup on unmount
  React.useEffect(() => {
    const activeRenders = activeRendersRef.current
    return () => {
      // Cancel all active renders
      for (const [id, controller] of activeRenders) {
        controller.abort()
        cancelRender(id)
      }
    }
  }, [cancelRender])

  return {
    renderPage,
    cancelRender,
    isWorkerRenderingAvailable: capabilities.canUseWorkerRendering,
    clearCache,
  }
}
