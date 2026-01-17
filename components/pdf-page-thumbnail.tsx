"use client"

import * as React from "react"
import { cn, debounce } from "@/lib/utils"
import { FileTextIcon, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { useScreenSize } from "@/hooks/use-screen-size"
import { useProgressiveQuality } from "@/hooks/use-progressive-quality"
import { logger } from "@/lib/logger"
import { 
  THUMBNAIL_QUALITY, 
  THUMBNAIL_DIMENSIONS, 
  INTERSECTION_OBSERVER,
  PDF_RENDER,
  ROTATION_ANGLES
} from "@/lib/constants"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
)
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
)


// Shared Promise for worker initialization (resolves when worker is ready)
let workerInitPromise: Promise<void> | null = null

// Error Boundary component to catch render-time errors
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void; retryKey: number },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void; retryKey: number }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorMessage = error?.message || String(error)
    logger.error('PageErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorMessage,
      componentStack: errorInfo.componentStack,
    })
    
    if (errorMessage.includes("messageHandler") || errorMessage.includes("sendWithPromise")) {
      this.props.onError()
    }
  }

  componentDidUpdate(prevProps: { retryKey: number }) {
    // Reset error state when retry key changes (indicating a retry)
    if (prevProps.retryKey !== this.props.retryKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

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
}: PdfPageThumbnailProps) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [documentReady, setDocumentReady] = React.useState(false)
  const [pageRenderReady, setPageRenderReady] = React.useState(false)
  const [workerReady, setWorkerReady] = React.useState(false)
  const [pageWidth, setPageWidth] = React.useState<number>(400)
  const [isVisible, setIsVisible] = React.useState(false)
  const [shouldUnmount, setShouldUnmount] = React.useState(false)
  const [devicePixelRatio, setDevicePixelRatio] = React.useState(1.0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const thumbnailRef = React.useRef<HTMLDivElement>(null)
  const renderRetryCountRef = React.useRef(0)
  const { screenSize } = useScreenSize()
  
  // Progressive quality management
  const {
    isHighQuality,
    setIsHighQuality,
  } = useProgressiveQuality({
    isVisible,
    shouldUnmount,
    fileType,
  })

  /**
   * Calculates optimal device pixel ratio based on screen size, container width, and total pages.
   * Reduces quality on smaller screens and when many pages are loaded to save memory.
   * 
   * The calculation applies multiple factors:
   * - Base DPR from screen size (mobile/tablet/desktop)
   * - Reduction for large document sets (50+, 100+, 200+ pages)
   * - Reduction for smaller container widths (< 300px, < 200px)
   * - Final value is clamped between MIN_DPR and MAX_DPR
   * 
   * @param containerWidth - The width of the container in pixels
   * @returns The calculated device pixel ratio, clamped between MIN_DPR and MAX_DPR
   */
  const calculateOptimalDPR = React.useCallback((containerWidth: number): number => {
    // Base DPR from screen size
    let baseDPR: number
    if (screenSize === "mobile") {
      baseDPR = THUMBNAIL_QUALITY.MOBILE_DPR
    } else if (screenSize === "tablet") {
      baseDPR = THUMBNAIL_QUALITY.TABLET_DPR
    } else {
      baseDPR = THUMBNAIL_QUALITY.DESKTOP_DPR
    }

    // Reduce further if many pages (memory pressure)
    if (totalPages > 50) baseDPR *= 0.9
    if (totalPages > 100) baseDPR *= 0.85
    if (totalPages > 200) baseDPR *= 0.8

    // Reduce slightly for smaller containers
    if (containerWidth < 300) baseDPR *= 0.9
    if (containerWidth < 200) baseDPR *= 0.85

    // Cap at min and max
    return Math.max(
      THUMBNAIL_QUALITY.MIN_DPR,
      Math.min(baseDPR, THUMBNAIL_QUALITY.MAX_DPR)
    )
  }, [screenSize, totalPages])

  /**
   * Initializes the PDF.js worker once on the client side (shared across all instances).
   * Uses a module-level promise to ensure only one worker is initialized.
   * 
   * The worker is configured to use a local worker file from the public folder,
   * which is automatically kept in sync with the installed pdfjs-dist version via
   * the postinstall script in package.json.
   * 
   * @returns A Promise that resolves when the worker is ready, or rejects on error
   * @throws Error if window is not available (SSR environment)
   */
  const initializeWorker = React.useCallback((): Promise<void> => {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("Window is not available"))
    }

    // If worker is already initialized, return resolved promise
    if (workerInitPromise) {
      return workerInitPromise
    }

    // Create and cache the initialization Promise
    workerInitPromise = import("react-pdf")
      .then((mod) => {
        // Use local worker file from public folder (updated to match pdfjs-dist version)
        // The worker file should be copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs
        // to public/pdf.worker.min.mjs to ensure version matching
        mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        // Wait a bit to ensure worker is fully initialized
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve()
          }, PDF_RENDER.WORKER_INIT_DELAY)
        })
      })
      .catch((err) => {
        // Reset promise on error so it can be retried
        workerInitPromise = null
        logger.error("Failed to initialize PDF worker:", err)
        throw err
      })

    return workerInitPromise
  }, [])

  // Set up PDF.js worker - all components await the same Promise (only for PDFs)
  React.useEffect(() => {
    // Skip worker initialization for images
    if (fileType === 'image') {
      setWorkerReady(true) // Set to true so rendering can proceed
      return
    }

    let isMounted = true

    initializeWorker()
      .then(() => {
        if (isMounted) {
          setWorkerReady(true)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true)
          setErrorMessage("Unable to load PDF viewer. Please refresh the page and try again.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [initializeWorker, fileType])

  // Reset states when fileUrl changes (new file loaded)
  React.useEffect(() => {
    setLoading(true)
    setError(false)
    setErrorMessage(null)
    setDocumentReady(false)
    setPageRenderReady(false)
    setIsVisible(false)
    setShouldUnmount(false)
    setIsHighQuality(false)
    renderRetryCountRef.current = 0
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Quality upgrade cleanup is handled by the hook
  }, [fileUrl, setIsHighQuality])

  // Intersection Observer for lazy loading and memory management
  // Unloads thumbnails far off-screen to free memory
  React.useEffect(() => {
    const element = thumbnailRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setShouldUnmount(false)
        } else {
          // Unmount when far off-screen to free memory
          // Calculate distance from viewport
          const rect = entry.boundingClientRect
          const viewportHeight = window.innerHeight
          const viewportTop = 0
          const viewportBottom = viewportHeight
          
          // Check if element is far above or below viewport
          const isFarAbove = rect.bottom < viewportTop - PDF_RENDER.UNMOUNT_DISTANCE
          const isFarBelow = rect.top > viewportBottom + PDF_RENDER.UNMOUNT_DISTANCE
          
          if (isFarAbove || isFarBelow) {
            setShouldUnmount(true)
          }
        }
      },
      { 
        rootMargin: INTERSECTION_OBSERVER.LOAD_MARGIN,
        threshold: INTERSECTION_OBSERVER.THRESHOLD
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

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
      const optimalDPR = calculateOptimalDPR(calculatedWidth)
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
  }, [calculateOptimalDPR])

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onDocumentLoadSuccess(_: { numPages: number }) {
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
    timeoutRef.current = setTimeout(() => {
      setDocumentReady(true)
      // Add an additional delay before allowing page render to ensure messageHandler is ready
      setTimeout(() => {
        setPageRenderReady(true)
        timeoutRef.current = null
      }, PDF_RENDER.PAGE_RENDER_DELAY)
    }, PDF_RENDER.DOCUMENT_READY_DELAY)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function onDocumentLoadError(error: Error) {
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
              // Render images using native img tag
              // For 90/270 degree rotations, we need to swap dimensions to prevent clipping
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl}
                alt={`Page ${pageNumber}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  // For 90/270 rotations, swap width/height to prevent clipping
                  width: (rotation === ROTATION_ANGLES.QUARTER || rotation === ROTATION_ANGLES.THREE_QUARTER) ? 'auto' : '100%',
                  height: (rotation === ROTATION_ANGLES.QUARTER || rotation === ROTATION_ANGLES.THREE_QUARTER) ? '100%' : 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
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
            ) : (
              // Render PDFs using react-pdf
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
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current)
                          }
                            timeoutRef.current = setTimeout(() => {
                              setPageRenderReady(true)
                              timeoutRef.current = null
                            }, PDF_RENDER.RENDER_RETRY_DELAY * (renderRetryCountRef.current + 1))
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
                            if (timeoutRef.current) {
                              clearTimeout(timeoutRef.current)
                            }
                            timeoutRef.current = setTimeout(() => {
                              setPageRenderReady(true)
                              timeoutRef.current = null
                            }, PDF_RENDER.RENDER_RETRY_DELAY * (renderRetryCountRef.current + 1))
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

