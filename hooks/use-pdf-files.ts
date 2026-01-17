// React
import * as React from "react"

// External libraries
import { PDFDocument } from "pdf-lib"

// Internal utilities
import { getPdfColor } from "@/lib/pdf-colors"
import { formatPdfError } from "@/lib/pdf-errors"
import { loadFileWithPreview, convertImageToPdf, loadPdfFromFile } from "@/lib/pdf-utils"
import { validateFileType, validateFileSize, isPdfFile } from "@/lib/file-validation"
import { logger } from "@/lib/logger"
import { FILE_LIMITS } from "@/lib/constants"

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types"

interface UsePdfFilesReturn {
  pdfFiles: PdfFile[]
  setPdfFiles: React.Dispatch<React.SetStateAction<PdfFile[]>>
  unifiedPages: UnifiedPage[]
  pageOrder: number[]
  setPageOrder: React.Dispatch<React.SetStateAction<number[]>>
  pdfCacheRef: React.MutableRefObject<Map<string, PDFDocument>>
  validateAndAddFiles: (files: FileList | File[], onError: (error: string | null) => void) => Promise<void>
  removeFile: (fileId: string) => void
  clearAll: () => void
  getCachedPdf: (fileId: string, file: File, fileType: 'pdf' | 'image') => Promise<PDFDocument>
}

/**
 * Generates a unique ID using timestamp and random string.
 * @returns A unique identifier string
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Creates a unified pages array from files (PDFs and images), assigning sequential page numbers
 * across all files. Images are treated as single-page documents.
 * 
 * @param files - Array of files (PDFs and images) to process
 * @returns Array of unified pages with sequential numbering
 */
function createUnifiedPages(files: PdfFile[]): UnifiedPage[] {
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

  /**
   * Gets a cached PDF document or loads it if not in cache.
   * Caches the loaded PDF for future use to avoid redundant loading operations.
   * For images, re-converts them to PDF if cache is missing.
   * 
   * @param fileId - The unique identifier of the file
   * @param file - The File object to load if not cached
   * @param fileType - File type ('pdf' | 'image') to determine loading strategy
   * @returns A promise that resolves to the PDFDocument
   */
  const getCachedPdf = React.useCallback(async (fileId: string, file: File, fileType: 'pdf' | 'image'): Promise<PDFDocument> => {
    const cached = pdfCacheRef.current.get(fileId)
    if (cached) {
      logger.log(`Retrieved cached PDF for ${fileType} file:`, file.name, 'with ID:', fileId)
      return cached
    }
    
    // For images, try to re-convert if cache is missing (fallback)
    // This can happen if cache was cleared or file was uploaded before caching was implemented
    if (fileType === 'image') {
      logger.warn('Cache miss for image, re-converting:', file.name, 'ID:', fileId)
      logger.warn('Available cache keys:', Array.from(pdfCacheRef.current.keys()))
      try {
        // Re-convert the image to PDF
        const pdf = await convertImageToPdf(file)
        pdfCacheRef.current.set(fileId, pdf)
        return pdf
      } catch (err) {
        throw new Error(`Failed to convert image to PDF: ${file.name}. ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    // For PDFs, load from file
    const pdf = await loadPdfFromFile(file)
    pdfCacheRef.current.set(fileId, pdf)
    return pdf
  }, [])

  /**
   * Validates and adds PDF files and images to the application state.
   * 
   * Performs validation checks:
   * - Verifies file type is PDF or image
   * - Checks file size against maximum limit
   * - Checks total file count against maximum limit
   * - Checks for duplicate files (by name and size)
   * - Validates PDF can be loaded and has pages, or image can be converted to PDF
   * - Enforces rate limiting between uploads
   * 
   * Creates blob URLs for preview and assigns colors to files.
   * Images are converted to single-page PDFs on upload and cached for performance.
   * 
   * @param files - FileList or array of File objects to validate and add
   * @param onError - Callback function to handle errors
   */
  const validateAndAddFiles = React.useCallback(async (files: FileList | File[], onError: (error: string | null) => void): Promise<void> => {
    const fileArray = Array.from(files)
    const pdfFilesToAdd: PdfFile[] = []
    const validationErrors: string[] = []

    // Rate limiting: enforce minimum delay between uploads
    const now = Date.now()
    const timeSinceLastUpload = now - lastUploadTimeRef.current
    if (timeSinceLastUpload < FILE_LIMITS.UPLOAD_RATE_LIMIT) {
      const delay = FILE_LIMITS.UPLOAD_RATE_LIMIT - timeSinceLastUpload
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    lastUploadTimeRef.current = Date.now()

    // Check total file count limit
    const currentFileCount = pdfFiles.length
    const newFileCount = fileArray.length
    if (currentFileCount + newFileCount > FILE_LIMITS.MAX_FILES) {
      validationErrors.push(`Cannot add ${newFileCount} file(s). Maximum ${FILE_LIMITS.MAX_FILES} files allowed. You currently have ${currentFileCount} file(s).`)
      onError(validationErrors[0])
      return
    }

    for (const file of fileArray) {
      // Validate file type
      const typeValidation = validateFileType(file)
      if (!typeValidation.valid) {
        validationErrors.push(typeValidation.error || `'${file.name}' is not a supported file type.`)
        continue
      }

      // Validate file size
      const sizeValidation = validateFileSize(file)
      if (!sizeValidation.valid) {
        validationErrors.push(sizeValidation.error || `'${file.name}' has an invalid file size.`)
        continue
      }

      // Determine file type after validation
      const isPdf = isPdfFile(file)

      if (pdfFiles.some((pf) => pf.file.name === file.name && pf.file.size === file.size)) {
        validationErrors.push(`'${file.name}' is already added.`)
        continue
      }

      let url: string | null = null
      try {
        // Use shared utility to load file and create preview URL
        const { pdf, url: previewUrl, fileType } = await loadFileWithPreview(file, isPdf)
        url = previewUrl

        const count = pdf.getPageCount()

        if (count === 0) {
          validationErrors.push(`'${file.name}' has no pages.`)
          if (url) {
            URL.revokeObjectURL(url)
            url = null
          }
          continue
        }

        // Generate fileId first, then cache the PDF
        const fileId = generateId()
        
        // Cache the converted PDF (for images, this is the converted PDF)
        // Make sure to cache BEFORE adding to state to avoid race conditions
        pdfCacheRef.current.set(fileId, pdf)
        
        logger.log(`Cached PDF for ${fileType} file:`, file.name, 'with ID:', fileId)

        // Assign color based on current file count
        const color = getPdfColor(pdfFiles.length + pdfFilesToAdd.length)

        pdfFilesToAdd.push({
          id: fileId,
          file,
          url: url, // url is guaranteed to be set at this point
          pageCount: count,
          color,
          type: fileType,
        })
        // Clear url reference since it's now owned by the PdfFile object
        url = null
      } catch (err) {
        // Ensure blob URL is cleaned up on error
        if (url) {
          URL.revokeObjectURL(url)
          url = null
        }
        const userMessage = formatPdfError(err, `Can't load '${file.name}':`)
        validationErrors.push(userMessage)
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0]
        : `Some files couldn't be added:\n${validationErrors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`
      onError(errorMessage)
    }

    if (pdfFilesToAdd.length > 0) {
      setPdfFiles((prev) => [...prev, ...pdfFilesToAdd])
      if (validationErrors.length === 0) {
        onError(null)
      }
    }
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
    setPdfFiles((prev) => {
      const file = prev.find(f => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.url)
      }
      // Clear PDF from cache
      pdfCacheRef.current.delete(fileId)
      return prev.filter((f) => f.id !== fileId)
    })
  }, [])

  const clearAll = React.useCallback((): void => {
    setPdfFiles((prev) => {
      // Clean up all blob URLs
      prev.forEach(file => {
        URL.revokeObjectURL(file.url)
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

