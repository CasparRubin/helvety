"use client";

import { Upload } from "lucide-react";
import * as React from "react";

import { PdfPageGrid } from "@/components/pdf-page-grid";
import { PdfToolkit } from "@/components/pdf-toolkit";
import { useSubscriptionContext } from "@/components/subscription-provider";
import { UpgradePrompt } from "@/components/upgrade-prompt";
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
  const [columns, handleColumnsChange] = useColumns();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Subscription context for tier-based limits
  const { limits, tier } = useSubscriptionContext();

  // State for showing upgrade prompt
  const [showUpgradePrompt, setShowUpgradePrompt] = React.useState(false);
  const [upgradeReason, setUpgradeReason] = React.useState<
    "files" | "pages" | "rotation"
  >("files");

  // PDF files management with tier-based limits
  const {
    pdfFiles,
    unifiedPages,
    pageOrder,
    setPageOrder,
    validateAndAddFiles: validateAndAddFilesBase,
    removeFile,
    clearAll: clearAllFiles,
    getCachedPdf,
    canAddMoreFiles,
    remainingFileSlots,
  } = usePdfFiles({
    maxFiles: limits.maxFiles,
    maxPages: limits.maxPages,
    onFileLimitReached: () => {
      setUpgradeReason("files");
      setShowUpgradePrompt(true);
    },
    onPageLimitReached: () => {
      setUpgradeReason("pages");
      setShowUpgradePrompt(true);
    },
  });

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

  // Page rotation (wrapped for consistency, gated by tier)
  const handleRotatePage = React.useCallback(
    (unifiedPageNumber: number, angle: number): void => {
      if (!limits.canRotate) {
        setUpgradeReason("rotation");
        setShowUpgradePrompt(true);
        return;
      }
      pageState.rotatePage(unifiedPageNumber, angle, setError);
    },
    [pageState, setError, limits.canRotate]
  );

  // Reset rotation (wrapped for consistency)
  const handleResetRotation = React.useCallback(
    (unifiedPageNumber: number): void => {
      if (!limits.canRotate) {
        return; // Silently ignore if rotation not allowed
      }
      pageState.resetRotation(unifiedPageNumber, setError);
    },
    [pageState, setError, limits.canRotate]
  );

  // Handle click on empty drop zone to open file picker
  const handleEmptyZoneClick = React.useCallback((): void => {
    // Only trigger file picker when no files are present
    if (pdfFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [pdfFiles.length]);

  return (
    <div
      className={cn(
        "h-full w-full",
        "flex flex-col gap-4 lg:flex-row",
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
      {/* Main Canvas Area - same structure as right panel: outer h-full, inner flex-1 overflow-y-auto */}
      <div
        className={cn(
          "flex w-full flex-1 flex-col",
          "h-full max-h-full min-h-0",
          "relative",
          "order-last lg:order-first"
        )}
      >
        <div
          className={cn(
            "bg-muted/30 border-border/50 flex min-h-0 flex-1 flex-col overflow-y-auto border p-6"
          )}
        >
          {/* Unified Drag and Drop Zone / Canvas - min-h-full fills scroll container (same height as panel inner) */}
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
                ? "Drag and drop PDF files or images here, click to select files, or use the upload button in the toolbar to add files."
                : `Drag and drop PDF files or images here, or use the upload button in the toolbar to add files. Currently displaying ${pageOrder.length} page${pageOrder.length !== 1 ? "s" : ""}.`}
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
                      Or use the panel{" "}
                      {columns === 1 ? "on the top" : "on the right"} to add
                      your files
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
                canRotate={limits.canRotate}
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

      {/* Toolkit Panel - Non-scrolling, always visible */}
      <aside
        aria-label="PDF toolkit controls"
        className="order-first flex-shrink-0 lg:order-last"
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
          tier={tier}
          limits={limits}
          canAddMoreFiles={canAddMoreFiles()}
          remainingFileSlots={remainingFileSlots}
        />
      </aside>

      {/* Upgrade Prompt Dialog */}
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        reason={upgradeReason}
        limits={limits}
      />
    </div>
  );
}
