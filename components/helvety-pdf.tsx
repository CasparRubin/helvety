"use client"

// React
import * as React from "react"

// External libraries
import { Upload, AlertCircle, X } from "lucide-react"

// Internal components
import { PdfPageGrid } from "@/components/pdf-page-grid"
import { PdfToolkit } from "@/components/pdf-toolkit"

// Internal utilities
import { cn } from "@/lib/utils"
import { normalizeRotation } from "@/lib/pdf-rotation"

// Custom hooks
import { useColumns } from "@/hooks/use-columns"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { useDragDrop } from "@/hooks/use-drag-drop"
import { usePdfFiles } from "@/hooks/use-pdf-files"
import { usePdfProcessing } from "@/hooks/use-pdf-processing"

/**
 * Main PDF toolkit component.
 * 
 * Provides a comprehensive interface for managing PDF files and images:
 * - Upload and validate files (PDFs and images)
 * - Reorder, delete, and rotate pages
 * - Extract individual pages
 * - Merge all pages into a single PDF
 * 
 * All processing happens client-side for privacy and security.
 * 
 * @returns The main PDF toolkit interface
 */
export function HelvetyPdf(): React.JSX.Element {
  // Custom hooks
  const [columns, handleColumnsChange] = useColumns()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Page state management
  const [deletedPages, setDeletedPages] = React.useState<Set<number>>(new Set())
  const [pageRotations, setPageRotations] = React.useState<Record<number, number>>({})

  // PDF files management
  const {
    pdfFiles,
    unifiedPages,
    pageOrder,
    setPageOrder,
    validateAndAddFiles: validateAndAddFilesBase,
    removeFile,
    clearAll: clearAllFiles,
    getCachedPdf,
  } = usePdfFiles()

  // Error handling - initialize first, will be updated when processing starts
  const [isProcessing, setIsProcessing] = React.useState(false)
  const errorHandler = useErrorHandler(isProcessing)

  // PDF processing
  const pdfProcessing = usePdfProcessing({
    pdfFiles,
    unifiedPages,
    pageOrder,
    deletedPages,
    pageRotations,
    getCachedPdf,
    onError: errorHandler.setError,
  })

  // Sync processing state
  React.useEffect(() => {
    setIsProcessing(pdfProcessing.isProcessing)
  }, [pdfProcessing.isProcessing])

  // Memoize computed statistics to prevent unnecessary recalculations
  const deletedCount: number = React.useMemo(() => {
    return pageOrder.filter((p: number) => deletedPages.has(p)).length
  }, [pageOrder, deletedPages])

  const rotatedCount: number = React.useMemo(() => {
    return Object.keys(pageRotations).filter((k: string) => pageRotations[Number(k)] !== 0).length
  }, [pageRotations])

  // Drag and drop
  const dragDrop = useDragDrop()

  // Extract stable error setter to avoid unnecessary re-renders
  const setError = errorHandler.setError

  // File input handler
  const handleFileInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const files: FileList | null = e.target.files
    if (files && files.length > 0) {
      validateAndAddFilesBase(files, setError)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [validateAndAddFilesBase, setError])

  // Wrapper for drag drop file handling
  const handleDropWithFiles = React.useCallback((files: FileList): void => {
    validateAndAddFilesBase(files, setError)
  }, [validateAndAddFilesBase, setError])

  // File removal with state cleanup
  const handleRemoveFile = React.useCallback((fileId: string): void => {
    removeFile(fileId)
    // Reset all page-related state when files change
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }, [removeFile, setError])

  // Clear all with state cleanup
  const handleClearAll = React.useCallback((): void => {
    clearAllFiles()
    setDeletedPages(new Set())
    setPageRotations({})
    setError(null)
  }, [clearAllFiles, setError])

  // Page deletion toggle
  const handleToggleDelete = React.useCallback((unifiedPageNumber: number): void => {
    setDeletedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(unifiedPageNumber)) {
        newSet.delete(unifiedPageNumber)
      } else {
        // Prevent deleting all pages
        const totalPages = pageOrder.length
        const deletedCount = newSet.size
        if (totalPages - deletedCount <= 1) {
          setError("Cannot delete all pages. At least one page must remain in the document.")
          return prev
        }
        newSet.add(unifiedPageNumber)
      }
      return newSet
    })
    setError(null)
  }, [pageOrder.length, setError])

  // Page rotation
  const handleRotatePage = React.useCallback((unifiedPageNumber: number, angle: number): void => {
    setPageRotations((prev) => {
      const currentRotation = prev[unifiedPageNumber] || 0
      const newRotation = normalizeRotation(currentRotation + angle)
      return {
        ...prev,
        [unifiedPageNumber]: newRotation,
      }
    })
    setError(null)
  }, [setError])

  // Reset rotation
  const handleResetRotation = React.useCallback((unifiedPageNumber: number): void => {
    setPageRotations((prev) => {
      const newRotations = { ...prev }
      delete newRotations[unifiedPageNumber]
      return newRotations
    })
    setError(null)
  }, [setError])

  // Handle click on empty drop zone to open file picker
  const handleEmptyZoneClick = React.useCallback((e: React.MouseEvent<HTMLElement>): void => {
    // Only trigger file picker when no files are present
    if (pdfFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [pdfFiles.length])

  return (
    <div 
      className={cn(
        "w-full min-h-screen py-4 md:py-6 lg:py-8",
        "flex flex-col lg:flex-row gap-6",
        "container mx-auto px-4"
      )}
      onDragEnter={dragDrop.handleDragEnter}
      onDragOver={dragDrop.handleDragOver}
      onDragLeave={dragDrop.handleDragLeave}
      onDrop={(e) => dragDrop.handleDrop(e, handleDropWithFiles)}
      role="region"
      aria-label="PDF toolkit workspace"
    >
      {/* Main Canvas Area */}
      <div className={cn(
        "flex-1 w-full",
        "relative"
      )}>
        {/* Unified Drag and Drop Zone / Canvas */}
        <section
          className={cn(
            "relative w-full min-h-[400px] transition-colors",
            dragDrop.isDragging
              ? "border-2 border-dashed border-primary bg-primary/5"
              : pdfFiles.length === 0
              ? "border-2 border-dashed border-border cursor-pointer"
              : "border-0"
          )}
          onClick={handleEmptyZoneClick}
          aria-label={pdfFiles.length === 0 ? "File drop zone and page canvas. Click to select files." : "File drop zone and page canvas"}
          aria-live="polite"
          aria-describedby="drop-zone-description"
        >
          <span id="drop-zone-description" className="sr-only">
            {pdfFiles.length === 0 
              ? "Drag and drop PDF files or images here, click to select files, or use the upload button in the toolbar to add files."
              : `Drag and drop PDF files or images here, or use the upload button in the toolbar to add files. Currently displaying ${pageOrder.length} page${pageOrder.length !== 1 ? 's' : ''}.`}
          </span>
          {/* Empty State - Drag and Drop Zone */}
          {pdfFiles.length === 0 && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-4 p-12"
            )}>
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium" role="heading" aria-level={2}>
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
              onExtract={pdfProcessing.extractPage}
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
            aria-label="Upload PDF files or images"
            aria-describedby="file-input-description"
          />
          <span id="file-input-description" className="sr-only">
            Select PDF files or images to add to the workspace. Supports multiple file selection.
          </span>
        </section>

        {/* Error Message */}
        {errorHandler.error && (
          <div 
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              {errorHandler.error.includes('\n') ? (
                <div className="whitespace-pre-line">{errorHandler.error}</div>
              ) : (
                <p>{errorHandler.error}</p>
              )}
            </div>
            <button
              onClick={errorHandler.dismissError}
              className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      {/* Toolkit Panel - Always Visible */}
      <aside aria-label="PDF toolkit controls">
        <PdfToolkit
        pdfFiles={pdfFiles}
        totalPages={pageOrder.length}
        deletedCount={deletedCount}
        rotatedCount={rotatedCount}
        onDownload={pdfProcessing.downloadMerged}
        onClearAll={handleClearAll}
        onRemoveFile={handleRemoveFile}
        onAddFiles={() => fileInputRef.current?.click()}
        isProcessing={isProcessing}
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />
      </aside>
    </div>
  )
}
