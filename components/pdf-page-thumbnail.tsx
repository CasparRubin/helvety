"use client"

import * as React from "react"
import { cn, debounce } from "@/lib/utils"
import { FileTextIcon, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { useScreenSize } from "@/hooks/use-screen-size"
import { useProgressiveQuality } from "@/hooks/use-progressive-quality"
import { usePdfRendering } from "@/hooks/use-pdf-rendering"
import { usePdfWorker } from "@/hooks/use-pdf-worker"
import { useThumbnailIntersection } from "@/hooks/use-thumbnail-intersection"
import { logger } from "@/lib/logger"
import { 
  THUMBNAIL_DIMENSIONS, 
  PDF_RENDER,
  ROTATION_ANGLES
} from "@/lib/constants"
import { calculateOptimalDPR } from "@/lib/thumbnail-dpr"
import { PdfImageThumbnail } from "@/components/pdf-image-thumbnail"
import { PdfImageBitmapThumbnail } from "@/components/pdf-imagebitmap-thumbnail"
import { PageErrorBoundary } from "@/components/pdf-page-error-boundary"
import { getImageBitmapCache } from "@/lib/imagebitmap-cache"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
)
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
)

interface PdfPageThumbnailProps {
  fileUrl: string
  pageNumber: number
  className?: string
  rotation?: number
  pdfColor?: string
  pdfFileName?: string
  finalPageNumber?: number | null
  fileType: 'pdf' | 'image'
  totalPages?: number
}

function PdfPageThumbnailComponent({ 
  fileUrl, 
  pageNumber, 
  className, 
  rotation,
  pdfColor,
  pdfFileName,
  finalPageNumber,
  fileType,
  totalPages = 1
}: PdfPageThumbnailProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [documentReady, setDocumentReady] = React.useState(false)
  const [pageRenderReady, setPageRenderReady] = React.useState(false)
  const [pageWidth, setPageWidth] = React.useState<number>(400)
  const [devicePixelRatio, setDevicePixelRatio] = React.useState(1.0)
  const [imageBitmap, setImageBitmap] = React.useState<ImageBitmap | null>(null)
  const [useImageBitmap, setUseImageBitmap] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const renderRetryCountRef = React.useRef(0)
  const { screenSize } = useScreenSize()
  
  // PDF rendering hook for ImageBitmap rendering
  const pdfRendering = usePdfRendering()
  
  // PDF worker initialization
  const { workerReady, error: workerError } = usePdfWorker(fileType)
  
  // Intersection observer for visibility management
  const { isVisible, shouldUnmount, thumbnailRef } = useThumbnailIntersection()
  
  // Progressive quality management
  const {
    isHighQuality,
    setIsHighQuality,
  } = useProgressiveQuality({
    isVisible,
    shouldUnmount,
    fileType,
  })

  // Handle worker initialization errors
  React.useEffect(() => {
    if (workerError) {
      setError(true)
      setErrorMessage(workerError)
    }
  }, [workerError])

  // Calculate optimal DPR callback
  const calculateDPR = React.useCallback((containerWidth: number): number => {
    return calculateOptimalDPR({
      screenSize,
      containerWidth,
      totalPages,
    })
  }, [screenSize, totalPages])

  // Reset states when fileUrl changes (new file loaded)
  React.useEffect(() => {
    setLoading(true)
    setError(false)
    setErrorMessage(null)
    setDocumentReady(false)
    setPageRenderReady(false)
    setIsHighQuality(false)
    setImageBitmap(null)
    setUseImageBitmap(false)
    renderRetryCountRef.current = 0
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Quality upgrade cleanup is handled by the hook
  }, [fileUrl, setIsHighQuality])

  // Check cache for ImageBitmap when visible
  // For Phase 1, we check cache but don't actively convert canvas to ImageBitmap yet
  // The infrastructure is in place for future enhancement
  React.useEffect(() => {
    if (
      fileType !== 'pdf' ||
      !isVisible ||
      shouldUnmount ||
      !pdfRendering.isWorkerRenderingAvailable ||
      !fileUrl ||
      pageWidth === 0
    ) {
      return
    }

    // Check cache for existing ImageBitmap
    const cacheKey = `${fileUrl}:${pageNumber}:${pageWidth}:${isHighQuality ? devicePixelRatio : devicePixelRatio * 0.75}:${rotation || 0}`
    const cache = getImageBitmapCache()
    const cached = cache.get(cacheKey)
    
    if (cached) {
      setImageBitmap(cached)
      setUseImageBitmap(true)
      setLoading(false)
      setError(false)
    } else {
      // For now, use canvas rendering (fallback)
      // Future: Convert canvas to ImageBitmap after render
      setUseImageBitmap(false)
    }
  }, [
    fileUrl,
    pageNumber,
    pageWidth,
    devicePixelRatio,
    rotation,
    isVisible,
    shouldUnmount,
    isHighQuality,
    fileType,
    pdfRendering,
  ])

  // Cleanup ImageBitmap on unmount
  React.useEffect(() => {
    return () => {
      if (imageBitmap) {
        imageBitmap.close()
      }
    }
  }, [imageBitmap])

  // Measure container width and update page width dynamically
  // This ensures pages (PDFs and images) always display at full width regardless of column count,
  // with height automatically adjusting to maintain proper aspect ratio
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = (): void => {
      const rect = container.getBoundingClientRect()
      // Calculate available width accounting for any padding/borders
      const computedStyle = window.getComputedStyle(container)
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0
      const borderRight = parseFloat(computedStyle.borderRightWidth) || 0
      
      const availableWidth = rect.width - paddingLeft - paddingRight - borderLeft - borderRight
      
      // Apply min/max limits to prevent memory issues
      const calculatedWidth = Math.max(
        THUMBNAIL_DIMENSIONS.MIN_WIDTH,
        Math.min(availableWidth, THUMBNAIL_DIMENSIONS.MAX_WIDTH)
      )
      setPageWidth(calculatedWidth)
      
      // Update DPR when width changes
      const optimalDPR = calculateDPR(calculatedWidth)
      setDevicePixelRatio(optimalDPR)
    }

    // Initial measurement
    updateWidth()

    // Debounced version of updateWidth to prevent excessive calculations
    const debouncedUpdateWidth = debounce(updateWidth, 150)

    // Use ResizeObserver if available, fallback to window resize
    let resizeObserver: ResizeObserver | null = null
    let usingResizeObserver = false
    
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        debouncedUpdateWidth()
      })
      resizeObserver.observe(container)
      usingResizeObserver = true
    } else {
      // Fallback to window resize event
      window.addEventListener("resize", debouncedUpdateWidth)
    }

    return (): void => {
      // Cancel any pending debounced calls
      debouncedUpdateWidth.cancel()
      
      // Clean up ResizeObserver or window event listener
      if (usingResizeObserver && resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      } else {
        // For window resize, we need to remove the listener
        // Note: This works because we cancel the debounce first
        window.removeEventListener("resize", debouncedUpdateWidth)
      }
    }
  }, [calculateDPR])

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Callback handler for when the PDF document successfully loads.
   * The numPages parameter is provided by react-pdf but not used here since
   * we're rendering a single page thumbnail. The parameter is required by
   * the library's callback signature.
   * 
   * @param _loadInfo - Document load information containing numPages (unused but required by react-pdf)
   */
  const onDocumentLoadSuccess = React.useCallback((_loadInfo: { numPages: number }): void => {
    setLoading(false)
    setError(false)
    setErrorMessage(null)
    renderRetryCountRef.current = 0
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Add a delay to ensure worker message handler is fully initialized
    // This prevents "messageHandler is null" errors that can occur if
    // the page tries to render before the worker is fully ready
    const timeoutId = setTimeout(() => {
      setDocumentReady(true)
      // Add an additional delay before allowing page render to ensure messageHandler is ready
      setTimeout(() => {
        setPageRenderReady(true)
      }, PDF_RENDER.PAGE_RENDER_DELAY)
    }, PDF_RENDER.DOCUMENT_READY_DELAY)
    // Store timeout ID in ref for cleanup
    // eslint-disable-next-line react-hooks/immutability -- Refs are mutable by design
    timeoutRef.current = timeoutId
  }, [])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      // Read ref value directly in cleanup - refs are stable and don't need to be dependencies
      const currentTimeout = timeoutRef.current
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }
    }
  }, [])

  /**
   * Callback handler for when the PDF document fails to load.
   * Provides user-friendly error messages based on the error type.
   * 
   * @param error - The error that occurred during PDF loading
   */
  function onDocumentLoadError(error: Error): void {
    logger.error("PDF load error:", error)
    setLoading(false)
    setError(true)
    setDocumentReady(false)
    setPageRenderReady(false)
    
    const errorMessageLower = error.message.toLowerCase()
    if (errorMessageLower.includes("password") || errorMessageLower.includes("encrypted")) {
      setErrorMessage("Password-protected")
    } else if (errorMessageLower.includes("corrupt") || errorMessageLower.includes("invalid")) {
      setErrorMessage("Corrupted")
    } else {
      setErrorMessage("Unable to load")
    }
  }

  // For images rotated 90/270 degrees, adjust container to prevent clipping
  const isImageRotated = fileType === 'image' && (rotation === ROTATION_ANGLES.QUARTER || rotation === ROTATION_ANGLES.THREE_QUARTER)
  
  return (
    <div className={cn("relative flex flex-col items-center gap-2", className)}>
      <div 
        ref={thumbnailRef}
        className={cn(
          "relative w-full flex items-center justify-center",
          isImageRotated ? "min-h-[300px] aspect-square" : "min-h-[200px]"
        )}
      >
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full flex items-center justify-center",
            isImageRotated ? "min-h-[300px] aspect-square" : "min-h-[200px]"
          )}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              {errorMessage && (
                <p className="text-xs text-destructive text-center px-2 max-w-full break-words">
                  {errorMessage}
                </p>
              )}
              {!errorMessage && (
                <FileTextIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          )}
          {!isVisible && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded" />
          )}
          {!error && fileUrl && isVisible && !shouldUnmount && (
            fileType === 'image' ? (
              <PdfImageThumbnail
                fileUrl={fileUrl}
                pageNumber={pageNumber}
                rotation={rotation}
                onLoad={() => {
                  setLoading(false)
                  setError(false)
                }}
                onError={() => {
                  setLoading(false)
                  setError(true)
                  setErrorMessage("Unable to load image")
                }}
              />
            ) : useImageBitmap && imageBitmap ? (
              // Render PDFs using ImageBitmap (optimized path)
              <PdfImageBitmapThumbnail
                imageBitmap={imageBitmap}
                pageNumber={pageNumber}
                rotation={rotation}
                onLoad={() => {
                  setLoading(false)
                  setError(false)
                }}
                onError={() => {
                  setLoading(false)
                  setError(true)
                  setErrorMessage("Unable to render page")
                }}
              />
            ) : (
              // Render PDFs using react-pdf (fallback)
              workerReady && !shouldUnmount ? (
                <Document
                  key={fileUrl}
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="w-full h-full"
                  error={
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                      <p className="text-xs text-destructive text-center px-2 max-w-full break-words">
                        Unable to load PDF
                      </p>
                    </div>
                  }
                >
                  {documentReady && pageRenderReady && workerReady && !shouldUnmount && (
                    <PageErrorBoundary
                      retryKey={renderRetryCountRef.current}
                      onError={() => {
                        // Handle messageHandler errors caught by error boundary
                        if (renderRetryCountRef.current < 3) {
                          setPageRenderReady(false)
                          renderRetryCountRef.current += 1
                          // Clear any existing timeout
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current)
                          }
                          // Set new timeout and store ID
                          const timeoutId = setTimeout(() => {
                            setPageRenderReady(true)
                          }, PDF_RENDER.RENDER_RETRY_DELAY * (renderRetryCountRef.current + 1))
                          // eslint-disable-next-line react-hooks/immutability -- Refs are mutable by design
                          timeoutRef.current = timeoutId
                        } else {
                          setError(true)
                          setErrorMessage("Failed to render page")
                        }
                      }}
                    >
                      <Page
                        key={`${pageNumber}-${pageWidth}-${rotation || 0}-${renderRetryCountRef.current}-${isHighQuality ? 'hq' : 'lq'}`}
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        rotate={rotation}
                        className="!scale-100"
                        devicePixelRatio={isHighQuality ? devicePixelRatio : devicePixelRatio * 0.75}
                        renderMode="canvas"
                        onRenderError={(error) => {
                          logger.error("Page render error:", error)
                          // Check if it's a messageHandler error - if so, retry after a delay
                          // This handles race conditions where the worker isn't fully ready
                          const errorMessage = error?.message || String(error)
                          if ((errorMessage.includes("messageHandler") || errorMessage.includes("sendWithPromise")) && renderRetryCountRef.current < 3) {
                            // Reset states and retry after a longer delay
                            setPageRenderReady(false)
                            renderRetryCountRef.current += 1
                            // Clear any existing timeout
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current)
                            }
                            // Set new timeout and store ID
                            const timeoutId = setTimeout(() => {
                              setPageRenderReady(true)
                            }, PDF_RENDER.RENDER_RETRY_DELAY * (renderRetryCountRef.current + 1))
                            // eslint-disable-next-line react-hooks/immutability -- Refs are mutable by design
                            timeoutRef.current = timeoutId
                          } else {
                            // For other errors or after max retries, show error state
                            setError(true)
                            setErrorMessage("Failed to render page")
                          }
                        }}
                      />
                    </PageErrorBoundary>
                  )}
                </Document>
              ) : null
            )
          )}
        </div>
      </div>
      <div className="w-full text-center space-y-1">
        {pdfFileName && (
          <p 
            className="text-xs truncate max-w-full font-medium" 
            title={pdfFileName}
            style={pdfColor ? { color: pdfColor } : undefined}
          >
            {pdfFileName}
          </p>
        )}
        <p className="text-xs font-medium">
          Page {pageNumber}
          {finalPageNumber !== null && finalPageNumber !== undefined && (
            <span className="text-muted-foreground ml-2">• Final Page: {finalPageNumber}</span>
          )}
        </p>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const PdfPageThumbnail = React.memo(PdfPageThumbnailComponent)

