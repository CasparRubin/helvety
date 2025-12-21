"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { FileTextIcon, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
)
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
)

// Timeout constants (in milliseconds)
const WORKER_INIT_DELAY = 100
const DOCUMENT_READY_DELAY = 500
const RENDER_RETRY_DELAY = 1000

// Shared Promise for worker initialization (resolves when worker is ready)
let workerInitPromise: Promise<void> | null = null

interface PdfPageThumbnailProps {
  fileUrl: string
  pageNumber: number
  className?: string
  rotation?: number
  pdfColor?: string
  pdfFileName?: string
  finalPageNumber?: number | null
}

export function PdfPageThumbnail({ 
  fileUrl, 
  pageNumber, 
  className, 
  rotation,
  pdfColor,
  pdfFileName,
  finalPageNumber
}: PdfPageThumbnailProps) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [documentReady, setDocumentReady] = React.useState(false)
  const [workerReady, setWorkerReady] = React.useState(false)

  // Initialize PDF.js worker once on client side (shared across all instances)
  // Returns a Promise that resolves when the worker is ready
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
        // Use local worker file from public folder (version matches react-pdf's pdfjs-dist)
        mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        // Wait a bit to ensure worker is fully initialized
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve()
          }, WORKER_INIT_DELAY)
        })
      })
      .catch((err) => {
        // Reset promise on error so it can be retried
        workerInitPromise = null
        console.error("Failed to initialize PDF worker:", err)
        throw err
      })

    return workerInitPromise
  }, [])

  // Set up PDF.js worker - all components await the same Promise
  React.useEffect(() => {
    let isMounted = true

    initializeWorker()
      .then(() => {
        if (isMounted) {
          setWorkerReady(true)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(true)
          setErrorMessage("Unable to load PDF viewer. Please refresh the page and try again.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [initializeWorker])

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setLoading(false)
    setError(false)
    setErrorMessage(null)
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Add a delay to ensure worker message handler is fully initialized
    // This prevents "messageHandler is null" errors that can occur if
    // the page tries to render before the worker is fully ready
    timeoutRef.current = setTimeout(() => {
      setDocumentReady(true)
      timeoutRef.current = null
    }, DOCUMENT_READY_DELAY)
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
    console.error("PDF load error:", error)
    setLoading(false)
    setError(true)
    setDocumentReady(false)
    
    const errorMessageLower = error.message.toLowerCase()
    if (errorMessageLower.includes("password") || errorMessageLower.includes("encrypted")) {
      setErrorMessage("Password-protected")
    } else if (errorMessageLower.includes("corrupt") || errorMessageLower.includes("invalid")) {
      setErrorMessage("Corrupted")
    } else {
      setErrorMessage("Unable to load")
    }
  }

  return (
    <div className={cn("relative flex flex-col items-center gap-2", className)}>
      <div 
        className={cn(
          "relative w-full aspect-[3/4] overflow-hidden flex items-center justify-center"
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
        {!error && fileUrl && workerReady ? (
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
            {documentReady && workerReady && (
              <Page
                pageNumber={pageNumber}
                width={400}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                rotate={rotation}
                className="!scale-100"
                onRenderError={(error) => {
                  console.error("Page render error:", error)
                  // Check if it's a messageHandler error - if so, retry after a delay
                  // This handles race conditions where the worker isn't fully ready
                  const errorMessage = error?.message || String(error)
                  if (errorMessage.includes("messageHandler") || errorMessage.includes("sendWithPromise")) {
                    // Reset documentReady and retry after a longer delay
                    setDocumentReady(false)
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current)
                    }
                    timeoutRef.current = setTimeout(() => {
                      setDocumentReady(true)
                      timeoutRef.current = null
                    }, RENDER_RETRY_DELAY)
                  } else {
                    // For other errors, show error state
                    setError(true)
                    setErrorMessage("Failed to render page")
                  }
                }}
              />
            )}
          </Document>
        ) : null}
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

