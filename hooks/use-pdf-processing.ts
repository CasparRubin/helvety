// React
import * as React from "react"

// External libraries
import { PDFDocument } from "pdf-lib"

// Internal utilities
import { formatTimestamp } from "@/lib/utils"
import { formatPdfError } from "@/lib/pdf-errors"
import { downloadBlob } from "@/lib/file-download"
import { applyPageRotation } from "@/lib/pdf-rotation"
import { extractPageFromPdf } from "@/lib/pdf-utils"
import { DELAYS, TIMEOUTS } from "@/lib/constants"
import { logger } from "@/lib/logger"

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types"

interface UsePdfProcessingReturn {
  isProcessing: boolean
  extractPage: (unifiedPageNumber: number) => Promise<void>
  downloadMerged: () => Promise<void>
}

interface UsePdfProcessingParams {
  pdfFiles: PdfFile[]
  unifiedPages: UnifiedPage[]
  pageOrder: number[]
  deletedPages: Set<number>
  pageRotations: Record<number, number>
  getCachedPdf: (fileId: string, file: File, fileType: 'pdf' | 'image') => Promise<PDFDocument>
  onError: (error: string | null) => void
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within the timeout,
 * it rejects with a timeout error.
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns A promise that either resolves with the original value or rejects on timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage))
      }, timeoutMs)
    }),
  ])
}

/**
 * Custom hook for PDF processing operations (extract and download).
 * Handles page extraction and merging PDFs with rotation support.
 * 
 * @param params - Configuration object containing file state and handlers
 * @returns Object containing processing state and operation handlers
 */
export function usePdfProcessing({
  pdfFiles,
  unifiedPages,
  pageOrder,
  deletedPages,
  pageRotations,
  getCachedPdf,
  onError,
}: UsePdfProcessingParams): UsePdfProcessingReturn {
  const [isProcessing, setIsProcessing] = React.useState(false)

  /**
   * Extracts a single page from a file (PDF or image) and downloads it as a new PDF.
   * 
   * Applies user-applied rotation to the extracted page. For images, the page is
   * already converted to a PDF, so extraction works identically to PDF pages.
   * 
   * @param unifiedPageNumber - The unified page number to extract
   */
  const extractPage = React.useCallback(async (unifiedPageNumber: number): Promise<void> => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      onError("No files loaded.")
      return
    }

    const page = unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNumber)
    if (!page) return

    const file = pdfFiles.find(f => f.id === page.fileId)
    if (!file) return

    setIsProcessing(true)
    onError(null)

    try {
      // Wrap operations with timeout
      const pdf = await withTimeout(
        getCachedPdf(file.id, file.file, file.type),
        TIMEOUTS.FILE_LOAD_TIMEOUT,
        `Loading file '${file.file.name}' timed out. The file may be too large or corrupted.`
      )
      
      const pageIndex = page.originalPageNumber - 1
      const newPdf = await withTimeout(
        extractPageFromPdf(pdf, pageIndex),
        TIMEOUTS.OPERATION_TIMEOUT,
        "Extracting page timed out. Please try again."
      )

      // Apply rotation if user has rotated this page
      const rotation = pageRotations[unifiedPageNumber] || 0
      if (rotation !== 0) {
        const newPage = newPdf.getPage(0)
        const originalPage = pdf.getPage(pageIndex)
        // Pass isImage flag to handle dimension swapping for rotated images
        await withTimeout(
          applyPageRotation(originalPage, newPage, rotation, file.type === 'image'),
          TIMEOUTS.OPERATION_TIMEOUT,
          "Applying rotation timed out. Please try again."
        )
      }

      const pdfBytes = await withTimeout(
        newPdf.save(),
        TIMEOUTS.OPERATION_TIMEOUT,
        "Saving PDF timed out. Please try again."
      )
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })

      // Remove file extension for base name (works for both PDF and image files)
      const baseName = file.file.name.replace(/\.[^/.]+$/, "")
      const dateStr = formatTimestamp()
      const filename = `${baseName}_page${page.originalPageNumber}_${dateStr}.pdf`

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP)

      onError(null)
    } catch (err) {
      const userMessage = formatPdfError(err, "Can't extract page:")
      onError(userMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFiles, unifiedPages, pageRotations, getCachedPdf, onError])

  /**
   * Merges all active (non-deleted) pages from all files (PDFs and images) into a single PDF
   * and downloads it.
   * 
   * Pages are merged in the order specified by pageOrder, excluding deleted pages.
   * User-applied rotations are preserved in the merged PDF. Images are already converted
   * to PDF pages, so they are handled identically to PDF pages.
   */
  const downloadMerged = React.useCallback(async (): Promise<void> => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      onError("Add at least one file to download.")
      return
    }

    const activePages = pageOrder.filter(pageNum => !deletedPages.has(pageNum))
    if (activePages.length === 0) {
      onError("Cannot download. All pages are deleted. At least one page must remain.")
      return
    }

    setIsProcessing(true)
    onError(null)

    try {
      // Create single merged PDF
      const mergedPdf = await PDFDocument.create()

      // Create lookup maps for O(1) access instead of O(n) Array.find()
      const pageMap = new Map<number, UnifiedPage>()
      unifiedPages.forEach(page => {
        pageMap.set(page.unifiedPageNumber, page)
      })

      const fileMap = new Map<string, PdfFile>()
      pdfFiles.forEach(file => {
        fileMap.set(file.id, file)
      })

      // Adaptive batch size: smaller batches for large documents to keep UI responsive
      // Larger batches for small documents to improve throughput
      const getBatchSize = (totalPages: number): number => {
        if (totalPages <= 10) return 10
        if (totalPages <= 50) return 8
        if (totalPages <= 100) return 5
        return 3 // Smaller batches for very large documents
      }

      const BATCH_SIZE = getBatchSize(activePages.length)
      
      for (let i = 0; i < activePages.length; i += BATCH_SIZE) {
        const batch = activePages.slice(i, i + BATCH_SIZE)
        
        await withTimeout(
          Promise.all(
            batch.map(async (unifiedPageNum) => {
              const page = pageMap.get(unifiedPageNum)
              if (!page) {
                throw new Error(`Page ${unifiedPageNum} not found in unified pages`)
              }

              const file = fileMap.get(page.fileId)
              if (!file) {
                throw new Error(`File not found for page ${unifiedPageNum}`)
              }

              try {
                // Get cached PDF (for images, this is the converted PDF)
                const pdf = await withTimeout(
                  getCachedPdf(file.id, file.file, file.type),
                  TIMEOUTS.FILE_LOAD_TIMEOUT,
                  `Loading file '${file.file.name}' timed out.`
                )
                const pageIndex = page.originalPageNumber - 1
                const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex])
                mergedPdf.addPage(copiedPage)

                // Apply rotation if user has rotated this page
                const rotation = pageRotations[unifiedPageNum] || 0
                if (rotation !== 0) {
                  const newPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1)
                  const originalPage = pdf.getPage(pageIndex)
                  // Pass isImage flag to handle dimension swapping for rotated images
                  await withTimeout(
                    applyPageRotation(originalPage, newPage, rotation, file.type === 'image'),
                    TIMEOUTS.OPERATION_TIMEOUT,
                    "Applying rotation timed out."
                  )
                }
              } catch (err) {
                logger.error('Error processing page:', err)
                logger.error('File details:', { id: file.id, name: file.file.name, type: file.type })
                const userMessage = err instanceof Error 
                  ? err.message 
                  : formatPdfError(err, `Can't process page from '${file.file.name}':`)
                throw new Error(userMessage)
              }
            })
          ),
          TIMEOUTS.OPERATION_TIMEOUT,
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} timed out. Please try again with fewer pages.`
        )

        // Yield to browser between batches to prevent UI blocking
        if (i + BATCH_SIZE < activePages.length) {
          await new Promise<void>((resolve) => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => resolve(), { timeout: 100 })
            } else {
              setTimeout(() => resolve(), 0)
            }
          })
        }
      }

      const pdfBytes = await withTimeout(
        mergedPdf.save(),
        TIMEOUTS.OPERATION_TIMEOUT,
        "Saving merged PDF timed out. Please try again."
      )
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })

      const dateStr = formatTimestamp()
      const filename = `helvety-pdf_${dateStr}.pdf`

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP)

      onError(null)
    } catch (err) {
      logger.error('Download error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Download failed. Check that all files are valid and try again."
      onError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFiles, unifiedPages, pageOrder, deletedPages, pageRotations, getCachedPdf, onError])

  return {
    isProcessing,
    extractPage,
    downloadMerged,
  }
}

