"use client";

import { Upload } from "lucide-react";
import * as React from "react";

import { PdfCommandBar, PdfPageGrid, PdfToolkit } from "@/components/pdf";
import { useColumns } from "@/hooks/use-columns";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useImageBitmapMemory } from "@/hooks/use-imagebitmap-memory";
import { usePdfFiles } from "@/hooks/use-pdf-files";
import { usePdfPageState } from "@/hooks/use-pdf-page-state";
import { usePdfProcessing } from "@/hooks/use-pdf-processing";
import { cn } from "@/lib/utils";

/**
 * Main PDF toolkit component.
 *
 * Provides an interface for managing PDF files and images:
 * - Upload and validate files (PDFs and images)
 * - Reorder, delete, and rotate pages
 * - Extract individual pages
 * - Merge all pages into a single PDF
 *
 * All processing happens client-side for privacy and security.
 * Completely free (up to 100MB per file) and no login required.
 *
 * @returns The main PDF toolkit interface
 */
export function HelvetyPdf(): React.JSX.Element {
  // Custom hooks
  const [columns, handleColumnsChange] = useColumns();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // PDF files management (up to 100MB per file)
  const {
    pdfFiles,
    unifiedPages,
    pageOrder,
    setPageOrder,
    validateAndAddFiles: validateAndAddFilesBase,
    removeFile,
    clearAll: clearAllFiles,
    getCachedPdf,
  } = usePdfFiles();

  // Error handling - initialize first, will be updated when processing starts
  const [isProcessing, setIsProcessing] = React.useState(false);
  const errorHandler = useErrorHandler(isProcessing);

  // Page state management (deletions, rotations, statistics)
  const pageState = usePdfPageState(pageOrder);

  // PDF processing
  const pdfProcessing = usePdfProcessing({
    pdfFiles,
    unifiedPages,
    pageOrder,
    deletedPages: pageState.deletedPages,
    pageRotations: pageState.pageRotations,
    getCachedPdf,
    onError: errorHandler.setError,
  });

  // Sync processing state
  React.useEffect(() => {
    setIsProcessing(pdfProcessing.isProcessing);
  }, [pdfProcessing.isProcessing]);

  // Drag and drop
  const dragDrop = useDragDrop();

  // ImageBitmap memory monitoring and cleanup
  useImageBitmapMemory();

  // Extract stable error setter to avoid unnecessary re-renders
  const setError = errorHandler.setError;

  // File input handler
  const handleFileInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const files: FileList | null = e.target.files;
      if (files && files.length > 0) {
        void validateAndAddFilesBase(files, setError);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [validateAndAddFilesBase, setError]
  );

  // Wrapper for drag drop file handling
  const handleDropWithFiles = React.useCallback(
    (files: FileList): void => {
      void validateAndAddFilesBase(files, setError);
    },
    [validateAndAddFilesBase, setError]
  );

  // File removal with state cleanup
  const handleRemoveFile = React.useCallback(
    (fileId: string): void => {
      removeFile(fileId);
      // Reset all page-related state when files change
      pageState.resetAll(setError);
    },
    [removeFile, pageState, setError]
  );

  // Clear all with state cleanup
  const handleClearAll = React.useCallback((): void => {
    clearAllFiles();
    pageState.resetAll(setError);
  }, [clearAllFiles, pageState, setError]);

  // Page deletion toggle (wrapped for consistency)
  const handleToggleDelete = React.useCallback(
    (unifiedPageNumber: number): void => {
      pageState.toggleDelete(unifiedPageNumber, pageOrder.length, setError);
    },
    [pageState, pageOrder.length, setError]
  );

  // Page rotation (wrapped for consistency)
  const handleRotatePage = React.useCallback(
    (unifiedPageNumber: number, angle: number): void => {
      pageState.rotatePage(unifiedPageNumber, angle, setError);
    },
    [pageState, setError]
  );

  // Reset rotation (wrapped for consistency)
  const handleResetRotation = React.useCallback(
    (unifiedPageNumber: number): void => {
      pageState.resetRotation(unifiedPageNumber, setError);
    },
    [pageState, setError]
  );

  // Handle click on empty drop zone to open file picker
  const handleEmptyZoneClick = React.useCallback((): void => {
    // Only trigger file picker when no files are present
    if (pdfFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [pdfFiles.length]);

  return (
    <div className="flex h-full flex-col">
      {/* Command Bar - sticky toolbar below navbar */}
      <PdfCommandBar
        fileCount={pdfFiles.length}
        onAddFiles={() => fileInputRef.current?.click()}
        onDownload={pdfProcessing.downloadMerged}
        onClearAll={handleClearAll}
        isProcessing={isProcessing}
      />

      {/* Main content area - flex-1 takes remaining height after command bar */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          "flex flex-col gap-4 lg:flex-row",
          "container mx-auto",
          "p-4"
        )}
        onDragEnter={dragDrop.handleDragEnter}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={(e) => dragDrop.handleDrop(e, handleDropWithFiles)}
        role="region"
        aria-label="PDF toolkit workspace"
      >
        {/* Main Canvas Area - outer h-full constrains height, inner flex-1 overflow-y-auto enables scrolling */}
        <div
          className={cn(
            "flex w-full flex-1 flex-col",
            "h-full max-h-full min-h-0",
            "relative"
          )}
        >
          <div
            className={cn(
              "bg-muted/30 border-border/50 flex min-h-0 flex-1 flex-col overflow-y-auto border p-6"
            )}
          >
            {/* Unified Drag and Drop Zone / Canvas - min-h-full fills scroll container */}
            <section
              className={cn(
                "relative min-h-full w-full transition-colors",
                dragDrop.isDragging
                  ? "border-primary bg-primary/5 border-2 border-dashed"
                  : pdfFiles.length === 0
                    ? "border-border cursor-pointer border-2 border-dashed"
                    : "border-0"
              )}
              onClick={handleEmptyZoneClick}
              aria-label={
                pdfFiles.length === 0
                  ? "File drop zone and page canvas. Click to select files."
                  : "File drop zone and page canvas"
              }
              aria-live="polite"
              aria-describedby="drop-zone-description"
            >
              <span id="drop-zone-description" className="sr-only">
                {pdfFiles.length === 0
                  ? "Drag and drop PDF files or images here, click to select files, or use the toolbar above to add files."
                  : `Drag and drop PDF files or images here, or use the toolbar above to add files. Currently displaying ${pageOrder.length} page${pageOrder.length !== 1 ? "s" : ""}.`}
              </span>
              {/* Empty State - Drag and Drop Zone */}
              {pdfFiles.length === 0 && (
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center gap-4 p-12"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload
                      className="text-muted-foreground h-12 w-12"
                      aria-hidden="true"
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        role="heading"
                        aria-level={2}
                      >
                        Drag and drop PDF files or images here
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Or use the toolbar above to add your files
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
                Select PDF files or images to add to the workspace. Supports
                multiple file selection.
              </span>
            </section>
          </div>
        </div>

        {/* Toolkit Panel - Desktop only: Display, Statistics, Files */}
        <aside
          aria-label="PDF toolkit controls"
          className="hidden flex-shrink-0 lg:block"
        >
          <PdfToolkit
            pdfFiles={pdfFiles}
            totalPages={pageOrder.length}
            deletedCount={pageState.deletedCount}
            rotatedCount={pageState.rotatedCount}
            onRemoveFile={handleRemoveFile}
            columns={columns}
            onColumnsChange={handleColumnsChange}
          />
        </aside>
      </div>
    </div>
  );
}
