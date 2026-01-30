"use client"

// React
import * as React from "react"

// External libraries
import { Upload } from "lucide-react"

// Internal components
import { PdfPageGrid } from "@/components/pdf-page-grid"
import { PdfToolkit } from "@/components/pdf-toolkit"
import { ScrollArea } from "@/components/ui/scroll-area"

// Internal utilities
import { cn } from "@/lib/utils"

// Custom hooks
import { useColumns } from "@/hooks/use-columns"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { useDragDrop } from "@/hooks/use-drag-drop"
import { usePdfFiles } from "@/hooks/use-pdf-files"
import { usePdfProcessing } from "@/hooks/use-pdf-processing"
import { usePdfPageState } from "@/hooks/use-pdf-page-state"
import { useImageBitmapMemory } from "@/hooks/use-imagebitmap-memory"

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

  // Page state management (deletions, rotations, statistics)
  const pageState = usePdfPageState(pageOrder)

  // PDF processing
  const pdfProcessing = usePdfProcessing({
    pdfFiles,
    unifiedPages,
    pageOrder,
    deletedPages: pageState.deletedPages,
    pageRotations: pageState.pageRotations,
    getCachedPdf,
    onError: errorHandler.setError,
  })

  // Sync processing state
  React.useEffect(() => {
    setIsProcessing(pdfProcessing.isProcessing)
  }, [pdfProcessing.isProcessing])

  // Drag and drop
  const dragDrop = useDragDrop()

  // ImageBitmap memory monitoring and cleanup
  useImageBitmapMemory()

  // Extract stable error setter to avoid unnecessary re-renders
  const setError = errorHandler.setError

  // File input handler
  const handleFileInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const files: FileList | null = e.target.files
    if (files && files.length > 0) {
      void validateAndAddFilesBase(files, setError)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [validateAndAddFilesBase, setError])

  // Wrapper for drag drop file handling
  const handleDropWithFiles = React.useCallback((files: FileList): void => {
    void validateAndAddFilesBase(files, setError)
  }, [validateAndAddFilesBase, setError])

  // File removal with state cleanup
  const handleRemoveFile = React.useCallback((fileId: string): void => {
    removeFile(fileId)
    // Reset all page-related state when files change
    pageState.resetAll(setError)
  }, [removeFile, pageState, setError])

  // Clear all with state cleanup
  const handleClearAll = React.useCallback((): void => {
    clearAllFiles()
    pageState.resetAll(setError)
  }, [clearAllFiles, pageState, setError])

  // Page deletion toggle (wrapped for consistency)
  const handleToggleDelete = React.useCallback((unifiedPageNumber: number): void => {
    pageState.toggleDelete(unifiedPageNumber, pageOrder.length, setError)
  }, [pageState, pageOrder.length, setError])

  // Page rotation (wrapped for consistency)
  const handleRotatePage = React.useCallback((unifiedPageNumber: number, angle: number): void => {
    pageState.rotatePage(unifiedPageNumber, angle, setError)
  }, [pageState, setError])

  // Reset rotation (wrapped for consistency)
  const handleResetRotation = React.useCallback((unifiedPageNumber: number): void => {
    pageState.resetRotation(unifiedPageNumber, setError)
  }, [pageState, setError])

  // Handle click on empty drop zone to open file picker
  const handleEmptyZoneClick = React.useCallback((): void => {
    // Only trigger file picker when no files are present
    if (pdfFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [pdfFiles.length])

  return (
    <div 
      className={cn(
        "w-full h-full",
        "flex flex-col lg:flex-row gap-4",
        "container mx-auto overflow-hidden",
        "p-4"
      )}
      onDragEnter={dragDrop.handleDragEnter}
      onDragOver={dragDrop.handleDragOver}
      onDragLeave={dragDrop.handleDragLeave}
      onDrop={(e) => dragDrop.handleDrop(e, handleDropWithFiles)}
      role="region"
      aria-label="PDF toolkit workspace"
    >
      {/* Main Canvas Area - Scrollable */}
      <div className={cn(
        "flex-1 min-w-0 min-h-0",
        "relative",
        "order-last lg:order-first"
      )}>
        <ScrollArea className="h-full w-full">
          {/* Unified Drag and Drop Zone / Canvas */}
          <section
            className={cn(
              "relative w-full min-h-[calc(100dvh-6rem)] transition-colors",
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
                deletedPages={pageState.deletedPages}
                pageRotations={pageState.pageRotations}
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
        </ScrollArea>
      </div>

      {/* Toolkit Panel - Non-scrolling, always visible */}
      <aside 
        aria-label="PDF toolkit controls" 
        className="order-first lg:order-last flex-shrink-0"
      >
        <PdfToolkit
          pdfFiles={pdfFiles}
          totalPages={pageOrder.length}
          deletedCount={pageState.deletedCount}
          rotatedCount={pageState.rotatedCount}
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
