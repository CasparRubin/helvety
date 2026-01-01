"use client"

import * as React from "react"
import { PDFDocument } from "pdf-lib"
import { Upload, AlertCircle, X } from "lucide-react"

import { PdfPageGrid } from "@/components/pdf-page-grid"
import { PdfToolkit } from "@/components/pdf-toolkit"

import { cn, formatTimestamp } from "@/lib/utils"
import { getPdfColor } from "@/lib/pdf-colors"
import { formatPdfError } from "@/lib/pdf-errors"
import { downloadBlob } from "@/lib/file-download"
import { applyPageRotation, normalizeRotation } from "@/lib/pdf-rotation"
import { loadPdfFromFile, extractPageFromPdf, convertImageToPdf } from "@/lib/pdf-utils"
import { DELAYS } from "@/lib/constants"
import { useColumns } from "@/hooks/use-columns"
import type { PdfFile, UnifiedPage } from "@/lib/types"

export function HelvetyPdf() {
  const [pdfFiles, setPdfFiles] = React.useState<PdfFile[]>([])
  const [unifiedPages, setUnifiedPages] = React.useState<UnifiedPage[]>([])
  const [pageOrder, setPageOrder] = React.useState<number[]>([]) // Array of unified page numbers in current order
  const [deletedPages, setDeletedPages] = React.useState<Set<number>>(new Set()) // Set of unified page numbers
  const [pageRotations, setPageRotations] = React.useState<Record<number, number>>({}) // unifiedPageNumber -> rotation angle
  const [isDragging, setIsDragging] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [columns, handleColumnsChange] = useColumns()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pdfCacheRef = React.useRef<Map<string, PDFDocument>>(new Map())

  /**
   * Generates a unique ID using timestamp and random string.
   * @returns A unique identifier string
   */
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

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
    if (pdfCacheRef.current.has(fileId)) {
      const cached = pdfCacheRef.current.get(fileId)!
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrieved cached PDF for ${fileType} file:`, file.name, 'with ID:', fileId)
      }
      return cached
    }
    
    // For images, try to re-convert if cache is missing (fallback)
    // This can happen if cache was cleared or file was uploaded before caching was implemented
    if (fileType === 'image') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache miss for image, re-converting:', file.name, 'ID:', fileId)
        console.warn('Available cache keys:', Array.from(pdfCacheRef.current.keys()))
      }
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
   * Creates a unified pages array from files (PDFs and images), assigning sequential page numbers
   * across all files. Images are treated as single-page documents.
   * 
   * @param files - Array of files (PDFs and images) to process
   * @returns Array of unified pages with sequential numbering
   */
  const createUnifiedPages = React.useCallback((files: PdfFile[]): UnifiedPage[] => {
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
  }, [])

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
  }, [pdfFiles, createUnifiedPages])

  /**
   * Validates and adds PDF files and images to the application state.
   * 
   * Performs validation checks:
   * - Verifies file type is PDF or image
   * - Checks for duplicate files (by name and size)
   * - Validates PDF can be loaded and has pages, or image can be converted to PDF
   * 
   * Creates blob URLs for preview and assigns colors to files.
   * Images are converted to single-page PDFs on upload and cached for performance.
   * 
   * @param files - FileList or array of File objects to validate and add
   */
  const validateAndAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const pdfFilesToAdd: PdfFile[] = []
    const validationErrors: string[] = []

    for (const file of fileArray) {
      const isPdf = file.type === "application/pdf"
      const isImage = file.type.startsWith("image/")

      if (!isPdf && !isImage) {
        validationErrors.push(`'${file.name}' is not a PDF or image file.`)
        continue
      }

      if (pdfFiles.some((pf) => pf.file.name === file.name && pf.file.size === file.size)) {
        validationErrors.push(`'${file.name}' is already added.`)
        continue
      }

      try {
        let pdf: PDFDocument
        let fileType: 'pdf' | 'image'
        let blob: Blob
        let url: string

        if (isPdf) {
          // Handle PDF files
          blob = new Blob([file], { type: "application/pdf" })
          url = URL.createObjectURL(blob)
          pdf = await loadPdfFromFile(file)
          fileType = 'pdf'
        } else {
          // Handle image files - convert to PDF
          blob = new Blob([file], { type: file.type })
          url = URL.createObjectURL(blob)
          pdf = await convertImageToPdf(file)
          fileType = 'image'
        }

        const count = pdf.getPageCount()

        if (count === 0) {
          validationErrors.push(`'${file.name}' has no pages.`)
          URL.revokeObjectURL(url)
          continue
        }

        // Generate fileId first, then cache the PDF
        const fileId = generateId()
        
        // Cache the converted PDF (for images, this is the converted PDF)
        // Make sure to cache BEFORE adding to state to avoid race conditions
        pdfCacheRef.current.set(fileId, pdf)
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cached PDF for ${fileType} file:`, file.name, 'with ID:', fileId)
        }

        // Assign color based on current file count
        const color = getPdfColor(pdfFiles.length + pdfFilesToAdd.length)

        pdfFilesToAdd.push({
          id: fileId,
          file,
          url,
          pageCount: count,
          color,
          type: fileType,
        })
      } catch (err) {
        const userMessage = formatPdfError(err, `Can't load '${file.name}':`)
        validationErrors.push(userMessage)
      }
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0]
        : `Some files couldn't be added:\n${validationErrors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}`
      setError(errorMessage)
    }

    if (pdfFilesToAdd.length > 0) {
      setPdfFiles((prev) => [...prev, ...pdfFilesToAdd])
      if (validationErrors.length === 0) {
        setError(null)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndAddFiles(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndAddFiles(files)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (fileId: string) => {
    const file = pdfFiles.find(f => f.id === fileId)
    if (file) {
      URL.revokeObjectURL(file.url)
    }
    // Clear PDF from cache
    pdfCacheRef.current.delete(fileId)
    setPdfFiles((prev) => prev.filter((f) => f.id !== fileId))
    // Reset all page-related state when files change
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }

  // Debug function to check cache state
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PDF Cache size:', pdfCacheRef.current.size)
      console.log('PDF Files:', pdfFiles.map(f => ({ id: f.id, name: f.file.name, type: f.type })))
    }
  }, [pdfFiles])

  const handleClearAll = () => {
    // Clean up all blob URLs
    pdfFiles.forEach(file => {
      URL.revokeObjectURL(file.url)
    })
    // Clear PDF cache
    pdfCacheRef.current.clear()
    setPdfFiles([])
    setUnifiedPages([])
    setPageOrder([])
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }

  const handleToggleDelete = (unifiedPageNumber: number) => {
    setDeletedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(unifiedPageNumber)) {
        newSet.delete(unifiedPageNumber)
      } else {
        // Prevent deleting all pages
        const totalPages = pageOrder.length
        const deletedCount = newSet.size
        if (totalPages - deletedCount <= 1) {
          setError("Cannot delete all pages. At least one page must remain.")
          return prev
        }
        newSet.add(unifiedPageNumber)
      }
      return newSet
    })
    setError(null)
  }

  const handleRotatePage = (unifiedPageNumber: number, angle: number) => {
    setPageRotations((prev) => {
      const currentRotation = prev[unifiedPageNumber] || 0
      const newRotation = normalizeRotation(currentRotation + angle)
      return {
        ...prev,
        [unifiedPageNumber]: newRotation,
      }
    })
    setError(null)
  }

  const handleResetRotation = (unifiedPageNumber: number) => {
    setPageRotations((prev) => {
      const newRotations = { ...prev }
      delete newRotations[unifiedPageNumber]
      return newRotations
    })
    setError(null)
  }

  /**
   * Extracts a single page from a file (PDF or image) and downloads it as a new PDF.
   * 
   * Applies user-applied rotation to the extracted page. For images, the page is
   * already converted to a PDF, so extraction works identically to PDF pages.
   * 
   * @param unifiedPageNumber - The unified page number to extract
   */
  const handleExtractPage = async (unifiedPageNumber: number) => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      setError("No files loaded.")
      return
    }

    const page = unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNumber)
    if (!page) return

    const file = pdfFiles.find(f => f.id === page.fileId)
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const pdf = await getCachedPdf(file.id, file.file, file.type)
      const pageIndex = page.originalPageNumber - 1
      const newPdf = await extractPageFromPdf(pdf, pageIndex)

      // Apply rotation if user has rotated this page
      const rotation = pageRotations[unifiedPageNumber] || 0
      if (rotation !== 0) {
        const newPage = newPdf.getPage(0)
        const originalPage = pdf.getPage(pageIndex)
        // Pass isImage flag to handle dimension swapping for rotated images
        await applyPageRotation(originalPage, newPage, rotation, file.type === 'image')
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })

      // Remove file extension for base name (works for both PDF and image files)
      const baseName = file.file.name.replace(/\.[^/.]+$/, "")
      const dateStr = formatTimestamp()
      const filename = `${baseName}_page${page.originalPageNumber}_${dateStr}.pdf`

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP)

      setError(null)
    } catch (err) {
      const userMessage = formatPdfError(err, "Can't extract page:")
      setError(userMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Merges all active (non-deleted) pages from all files (PDFs and images) into a single PDF
   * and downloads it.
   * 
   * Pages are merged in the order specified by pageOrder, excluding deleted pages.
   * User-applied rotations are preserved in the merged PDF. Images are already converted
   * to PDF pages, so they are handled identically to PDF pages.
   */
  const handleDownload = async () => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      setError("Add at least one file to download.")
      return
    }

    const activePages = pageOrder.filter(pageNum => !deletedPages.has(pageNum))
    if (activePages.length === 0) {
      setError("Cannot download. All pages are deleted. At least one page must remain.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create single merged PDF
      const mergedPdf = await PDFDocument.create()

      // Process pages in batches to prevent UI blocking
      const BATCH_SIZE = 5
      for (let i = 0; i < activePages.length; i += BATCH_SIZE) {
        const batch = activePages.slice(i, i + BATCH_SIZE)
        
        await Promise.all(
          batch.map(async (unifiedPageNum) => {
            const page = unifiedPages.find(p => p.unifiedPageNumber === unifiedPageNum)
            if (!page) {
              throw new Error(`Page ${unifiedPageNum} not found in unified pages`)
            }

            const file = pdfFiles.find(f => f.id === page.fileId)
            if (!file) {
              throw new Error(`File not found for page ${unifiedPageNum}`)
            }

            try {
              // Get cached PDF (for images, this is the converted PDF)
              const pdf = await getCachedPdf(file.id, file.file, file.type)
              const pageIndex = page.originalPageNumber - 1
              const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex])
              mergedPdf.addPage(copiedPage)

              // Apply rotation if user has rotated this page
              const rotation = pageRotations[unifiedPageNum] || 0
              if (rotation !== 0) {
                const newPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1)
                const originalPage = pdf.getPage(pageIndex)
                // Pass isImage flag to handle dimension swapping for rotated images
                await applyPageRotation(originalPage, newPage, rotation, file.type === 'image')
              }
            } catch (err) {
              console.error('Error processing page:', err)
              console.error('File details:', { id: file.id, name: file.file.name, type: file.type })
              const userMessage = err instanceof Error 
                ? err.message 
                : formatPdfError(err, `Can't process page from '${file.file.name}':`)
              throw new Error(userMessage)
            }
          })
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

      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })

      const dateStr = formatTimestamp()
      const filename = `helvety-pdf_${dateStr}.pdf`

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP)

      setError(null)
    } catch (err) {
      console.error('Download error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Download failed. Check that all files are valid and try again."
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismissError = () => {
    setError(null)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }
  }

  /**
   * Auto-dismisses non-critical errors after a delay.
   * Critical errors (file loading/processing failures) remain visible until manually dismissed.
   */
  React.useEffect(() => {
    if (error && !isProcessing) {
      const isCriticalError = error.includes("Can't process") || error.includes("Can't load") || error.includes("Can't extract") || error.includes("Download failed")
      
      if (!isCriticalError) {
        errorTimeoutRef.current = setTimeout(() => {
          setError(null)
        }, DELAYS.ERROR_AUTO_DISMISS)
      }

      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
      }
    }
  }, [error, isProcessing])

  // Cleanup effect: revoke blob URLs and clear PDF cache on unmount
  React.useEffect(() => {
    return () => {
      // Clean up all blob URLs
      pdfFiles.forEach(file => {
        URL.revokeObjectURL(file.url)
      })
      // Clear PDF cache
      pdfCacheRef.current.clear()
    }
  }, [pdfFiles])

  return (
    <div 
      className={cn(
        "w-full min-h-screen py-4 md:py-6 lg:py-8",
        "flex flex-col lg:flex-row gap-6",
        "container mx-auto px-4"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main Canvas Area */}
      <div className={cn(
        "flex-1 w-full",
        "relative"
      )}>
        {/* Unified Drag and Drop Zone / Canvas */}
        <div
          className={cn(
            "relative w-full min-h-[400px] transition-colors",
            isDragging
              ? "border-2 border-dashed border-primary bg-primary/5"
              : pdfFiles.length === 0
              ? "border-2 border-dashed border-border"
              : "border-0"
          )}
        >
          {/* Empty State - Drag and Drop Zone */}
          {pdfFiles.length === 0 && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-4 p-12",
              "pointer-events-none"
            )}>
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drag and drop PDF files or images here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Or use the panel {columns === 1 ? "on the top" : "on the right"} to add your files
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pages Grid - displays PDF pages and images */}
          {pdfFiles.length > 0 && unifiedPages.length > 0 && (
            <PdfPageGrid
              pdfFiles={pdfFiles}
              unifiedPages={unifiedPages}
              pageOrder={pageOrder}
              deletedPages={deletedPages}
              pageRotations={pageRotations}
              onReorder={setPageOrder}
              onToggleDelete={handleToggleDelete}
              onRotate={handleRotatePage}
              onResetRotation={handleResetRotation}
              onExtract={handleExtractPage}
              isProcessing={isProcessing}
              columns={columns}
            />
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div 
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              {error.includes('\n') ? (
                <div className="whitespace-pre-line">{error}</div>
              ) : (
                <p>{error}</p>
              )}
            </div>
            <button
              onClick={handleDismissError}
              className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      {/* Toolkit Panel - Always Visible */}
      <PdfToolkit
        pdfFiles={pdfFiles}
        totalPages={pageOrder.length}
        deletedCount={pageOrder.filter(p => deletedPages.has(p)).length}
        rotatedCount={Object.keys(pageRotations).filter(k => pageRotations[Number(k)] !== 0).length}
        onDownload={handleDownload}
        onClearAll={handleClearAll}
        onRemoveFile={handleRemoveFile}
        onAddFiles={() => fileInputRef.current?.click()}
        isProcessing={isProcessing}
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />
    </div>
  )
}

