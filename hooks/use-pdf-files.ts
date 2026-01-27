// React
import * as React from "react"

// External libraries
import { PDFDocument } from "pdf-lib"

// Internal utilities
import { convertImageToPdf } from "@/lib/pdf-conversion"
import { loadPdfFromFile } from "@/lib/pdf-loading"
import { validateFiles } from "@/lib/validation-utils"
import { formatValidationErrors } from "@/lib/error-formatting"
import { processFile } from "@/lib/file-processing"
import { safeRevokeObjectURL } from "@/lib/blob-url-utils"
import { logger } from "@/lib/logger"
import { FILE_LIMITS } from "@/lib/constants"
import { isMobileDevice } from "@/hooks/use-mobile"
import { yieldToBrowserIfNeeded } from "@/lib/batch-processing"
import { createPdfErrorInfo, PdfErrorType } from "@/lib/pdf-errors"

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types"

interface UsePdfFilesReturn {
  readonly pdfFiles: ReadonlyArray<PdfFile>
  readonly setPdfFiles: React.Dispatch<React.SetStateAction<PdfFile[]>>
  readonly unifiedPages: ReadonlyArray<UnifiedPage>
  readonly pageOrder: ReadonlyArray<number>
  readonly setPageOrder: React.Dispatch<React.SetStateAction<number[]>>
  readonly pdfCacheRef: React.MutableRefObject<Map<string, PDFDocument>>
  readonly validateAndAddFiles: (files: FileList | ReadonlyArray<File>, onError: (error: string | null) => void) => Promise<void>
  readonly removeFile: (fileId: string) => void
  readonly clearAll: () => void
  readonly getCachedPdf: (fileId: string, file: File, fileType: 'pdf' | 'image') => Promise<PDFDocument>
}


/**
 * Creates a unified pages array from files (PDFs and images), assigning sequential page numbers
 * across all files. Images are treated as single-page documents.
 * 
 * @param files - Array of files (PDFs and images) to process
 * @returns Array of unified pages with sequential numbering
 * 
 * @example
 * ```typescript
 * const pages = createUnifiedPages([pdfFile1, pdfFile2])
 * // Returns: [{ id: 'file1-page-1', fileId: 'file1', ... }, ...]
 * ```
 */
function createUnifiedPages(files: ReadonlyArray<PdfFile>): UnifiedPage[] {
  const pages: UnifiedPage[] = []
  let unifiedNumber = 1

  for (const file of files) {
    for (let i = 1; i <= file.pageCount; i++) {
      pages.push({
        id: `${file.id}-page-${i}`,
        fileId: file.id,
        originalPageNumber: i,
        unifiedPageNumber: unifiedNumber++,
      })
    }
  }

  return pages
}

/**
 * Custom hook for managing PDF files and their associated state.
 * Handles file validation, caching, and unified page management.
 * 
 * @returns Object containing file state, handlers, and utilities
 */
export function usePdfFiles(): UsePdfFilesReturn {
  const [pdfFiles, setPdfFiles] = React.useState<PdfFile[]>([])
  const [unifiedPages, setUnifiedPages] = React.useState<UnifiedPage[]>([])
  const [pageOrder, setPageOrder] = React.useState<number[]>([])
  const pdfCacheRef = React.useRef<Map<string, PDFDocument>>(new Map())
  const lastUploadTimeRef = React.useRef<number>(0)
  // Use ref to store current pdfFiles to avoid recreating validateAndAddFiles callback
  const pdfFilesRef = React.useRef<PdfFile[]>(pdfFiles)

  /**
   * Gets a cached PDF document or loads it if not in cache.
   * Caches the loaded PDF for future use to avoid redundant loading operations.
   * For images, re-converts them to PDF if cache is missing.
   * 
   * @param fileId - The unique identifier of the file
   * @param file - The File object to load if not cached
   * @param fileType - File type ('pdf' | 'image') to determine loading strategy
   * @returns A promise that resolves to the PDFDocument
   * @throws {Error} If fileId is invalid, file is not found, or loading/conversion fails
   * 
   * @example
   * ```typescript
   * const pdf = await getCachedPdf('file-123', file, 'pdf')
   * // Returns cached PDF or loads from file if not cached
   * ```
   */
  const getCachedPdf = React.useCallback(async (fileId: string, file: File, fileType: 'pdf' | 'image'): Promise<PDFDocument> => {
    // Validate fileId
    if (!fileId || typeof fileId !== 'string' || fileId.trim().length === 0) {
      throw new Error(`Invalid fileId provided: "${fileId}". File: "${file.name}"`)
    }

    // Validate file exists in current files list
    const currentFiles = pdfFilesRef.current
    const fileExists = currentFiles.some((f) => f.id === fileId)
    if (!fileExists) {
      throw new Error(`File with ID "${fileId}" not found. File may have been removed. Original file: "${file.name}"`)
    }

    const cached = pdfCacheRef.current.get(fileId)
    if (cached) {
      // Update LRU access order by moving to end (most recently used)
      // This prevents frequently accessed items from being evicted
      pdfCacheRef.current.delete(fileId)
      pdfCacheRef.current.set(fileId, cached)
      logger.log(`Retrieved cached PDF for ${fileType} file: "${file.name}" (ID: ${fileId})`)
      return cached
    }
    
    // For images, try to re-convert if cache is missing (fallback)
    // This can happen if cache was cleared or file was uploaded before caching was implemented
    if (fileType === 'image') {
      logger.warn(`Cache miss for image: "${file.name}" (ID: ${fileId}). Re-converting...`)
      logger.warn('Available cache keys:', Array.from(pdfCacheRef.current.keys()))
      try {
        // Re-convert the image to PDF
        const pdf = await convertImageToPdf(file)
        pdfCacheRef.current.set(fileId, pdf)
        logger.log(`Re-converted and cached image: "${file.name}" (ID: ${fileId})`)
        return pdf
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        throw new Error(`Failed to convert image to PDF: "${file.name}" (ID: ${fileId}). ${errorMessage}`)
      }
    }
    
    // For PDFs, load from file
    try {
      const pdf = await loadPdfFromFile(file)
      pdfCacheRef.current.set(fileId, pdf)
      logger.log(`Loaded and cached PDF: "${file.name}" (ID: ${fileId})`)
      return pdf
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to load PDF: "${file.name}" (ID: ${fileId}). ${errorMessage}`)
    }
  }, [])

  /**
   * Validates and adds PDF files and images to the application state.
   * 
   * Performs validation checks:
   * - Verifies file type is PDF or image
   * - Checks total file count against maximum limit
   * - Checks for duplicate files (by name and size)
   * - Validates PDF can be loaded and has pages, or image can be converted to PDF
   * - Enforces rate limiting between uploads
   * 
   * Progressive processing:
   * - Processes files one at a time with browser yielding between files
   * - Yields more frequently on mobile devices and for large files
   * - Implements retry logic for transient failures (up to 2 retries)
   * - Continues processing remaining files even if some fail
   * 
   * Creates blob URLs for preview and assigns colors to files.
   * Images are converted to single-page PDFs on upload and cached for performance.
   * 
   * @param files - FileList or array of File objects to validate and add
   * @param onError - Callback function to handle errors
   */
  const validateAndAddFiles = React.useCallback(async (files: FileList | ReadonlyArray<File>, onError: (error: string | null) => void): Promise<void> => {
    const fileArray = Array.from(files)
    const pdfFilesToAdd: PdfFile[] = []
    const isMobile = isMobileDevice()

    // Rate limiting: enforce minimum delay between uploads
    const now = Date.now()
    const timeSinceLastUpload = now - lastUploadTimeRef.current
    if (timeSinceLastUpload < FILE_LIMITS.UPLOAD_RATE_LIMIT) {
      const delay = FILE_LIMITS.UPLOAD_RATE_LIMIT - timeSinceLastUpload
      await new Promise<void>((resolve: () => void) => setTimeout(resolve, delay))
    }
    lastUploadTimeRef.current = Date.now()

    // Validate files using extracted utility
    // Use ref to get current pdfFiles without creating dependency
    const currentPdfFiles = pdfFilesRef.current
    const validationResult = validateFiles(fileArray, currentPdfFiles)
    if (!validationResult.valid) {
      const errorMessage = formatValidationErrors(validationResult.errors)
      onError(errorMessage)
      return
    }

    const validationErrors: string[] = []
    const MAX_RETRIES = 2
    
    // Process each file progressively with yielding and retry logic
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const fileIndex = currentPdfFiles.length + pdfFilesToAdd.length
      
      // Yield to browser before processing (especially important for large files and mobile)
      await yieldToBrowserIfNeeded(file.size, isMobile, i > 0) // Always yield after first file
      
      let result = await processFile(file, fileIndex, pdfCacheRef.current, isMobile)
      let retryCount = 0
      
      // Retry logic for transient failures
      while ('error' in result && retryCount < MAX_RETRIES) {
        const errorInfo = createPdfErrorInfo(new Error(result.error), `Processing '${file.name}':`)
        
        // Only retry for certain error types (network, timeout, unknown - not corrupted/invalid)
        const isRetryable = errorInfo.type === PdfErrorType.NETWORK || 
                           errorInfo.type === PdfErrorType.TIMEOUT ||
                           errorInfo.type === PdfErrorType.UNKNOWN
        
        if (!isRetryable) {
          break // Don't retry for corrupted/invalid files
        }
        
        retryCount++
        logger.log(`Retrying file '${file.name}' (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`)
        
        // Yield before retry to give browser time to recover
        await yieldToBrowserIfNeeded(file.size, isMobile, true)
        
        result = await processFile(file, fileIndex, pdfCacheRef.current, isMobile)
      }
      
      if ('error' in result) {
        // Enhance error message for memory-related issues
        let errorMessage = result.error
        if (errorMessage.includes('memory') || errorMessage.includes('allocation') || 
            errorMessage.includes('out of memory') || errorMessage.toLowerCase().includes('quota')) {
          errorMessage = `${errorMessage} The file may be too large for your device's available memory. Try closing other browser tabs or processing fewer files at once.`
        }
        validationErrors.push(errorMessage)
        logger.error(`Failed to process file '${file.name}' after ${retryCount + 1} attempt(s):`, errorMessage)
      } else {
        pdfFilesToAdd.push(result.pdfFile)
        logger.log(`Successfully processed file '${file.name}' (${i + 1}/${fileArray.length})`)
      }
      
      // Yield after processing each file (especially on mobile)
      // This keeps the UI responsive and allows memory to be freed
      if (i < fileArray.length - 1) {
        await yieldToBrowserIfNeeded(file.size, isMobile, true)
      }
    }

    // Add all successfully processed files at once
    if (pdfFilesToAdd.length > 0) {
      setPdfFiles((prev) => [...prev, ...pdfFilesToAdd])
    }

    if (validationErrors.length > 0) {
      const errorMessage = formatValidationErrors(validationErrors)
      onError(errorMessage)
    } else if (pdfFilesToAdd.length > 0 || fileArray.length > 0) {
      // Clear error if we successfully processed at least one file
      onError(null)
    }
  }, []) // Removed pdfFiles dependency - using ref instead for better performance

  // Keep ref in sync with state
  React.useEffect(() => {
    pdfFilesRef.current = pdfFiles
  }, [pdfFiles])

  // Update unified pages when files change
  React.useEffect(() => {
    if (pdfFiles.length > 0) {
      const newUnifiedPages = createUnifiedPages(pdfFiles)
      setUnifiedPages(newUnifiedPages)
      // Initialize page order as sequential
      setPageOrder(newUnifiedPages.map(p => p.unifiedPageNumber))
    } else {
      setUnifiedPages([])
      setPageOrder([])
    }
  }, [pdfFiles])

  const removeFile = React.useCallback((fileId: string): void => {
    setPdfFiles((prev: PdfFile[]) => {
      const file: PdfFile | undefined = prev.find((f: PdfFile) => f.id === fileId)
      if (file) {
        safeRevokeObjectURL(file.url)
      }
      // Clear PDF from cache
      pdfCacheRef.current.delete(fileId)
      return prev.filter((f: PdfFile) => f.id !== fileId)
    })
  }, [])

  const clearAll = React.useCallback((): void => {
    setPdfFiles((prev: PdfFile[]) => {
      // Clean up all blob URLs
      prev.forEach((file: PdfFile) => {
        safeRevokeObjectURL(file.url)
      })
      // Clear PDF cache
      pdfCacheRef.current.clear()
      return []
    })
    setUnifiedPages([])
    setPageOrder([])
  }, [])

  return {
    pdfFiles,
    setPdfFiles,
    unifiedPages,
    pageOrder,
    setPageOrder,
    pdfCacheRef,
    validateAndAddFiles,
    removeFile,
    clearAll,
    getCachedPdf,
  }
}

