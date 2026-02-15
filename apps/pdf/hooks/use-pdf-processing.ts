// React

// External libraries
import { logger } from "@helvety/shared/logger";
import { PDFDocument } from "pdf-lib";
import * as React from "react";

// Internal utilities
import { calculateBatchSize, yieldToBrowser } from "@/lib/batch-processing";
import { DELAYS, TIMEOUTS } from "@/lib/constants";
import { handleError } from "@/lib/error-handler";
import { downloadBlob } from "@/lib/file-download";
import { createPdfErrorInfo } from "@/lib/pdf-errors";
import { extractPageFromPdf } from "@/lib/pdf-extraction";
import { formatTimestamp } from "@/lib/pdf-helpers";
import { createPageMap, createFileMap } from "@/lib/pdf-lookup-utils";
import {
  applyPageRotation,
  createRotatedImagePage,
  needsContentTransform,
  normalizeRotation,
} from "@/lib/pdf-rotation";
import { withTimeout } from "@/lib/timeout-utils";

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types";

/** Return type of usePdfProcessing: isProcessing, extractPage, downloadMerged. */
interface UsePdfProcessingReturn {
  readonly isProcessing: boolean;
  readonly extractPage: (unifiedPageNumber: number) => Promise<void>;
  readonly downloadMerged: () => Promise<void>;
}

/** Parameters for usePdfProcessing: file state, unified pages, page order, deleted pages, rotations, getCachedPdf, onError. */
interface UsePdfProcessingParams {
  readonly pdfFiles: ReadonlyArray<PdfFile>;
  readonly unifiedPages: ReadonlyArray<UnifiedPage>;
  readonly pageOrder: ReadonlyArray<number>;
  readonly deletedPages: ReadonlySet<number>;
  readonly pageRotations: Readonly<Record<number, number>>;
  readonly getCachedPdf: (
    fileId: string,
    file: File,
    fileType: "pdf" | "image"
  ) => Promise<PDFDocument>;
  readonly onError: (error: string | null) => void;
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
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = React.useRef(true);

  // Use ref to store latest pageRotations to avoid stale closure issues
  // This ensures we always read the most current rotation state, even during rapid updates
  const pageRotationsRef =
    React.useRef<Readonly<Record<number, number>>>(pageRotations);

  // Sync ref with prop changes to always have the latest state
  React.useEffect(() => {
    pageRotationsRef.current = pageRotations;
  }, [pageRotations]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Extracts a single page from a file (PDF or image) and downloads it as a new PDF.
   *
   * Applies user-applied rotation to the extracted page. For images with 90°/270°
   * rotation, uses content transformation to properly handle landscape-to-portrait
   * conversions without white space. For PDFs and 180° rotations, uses standard
   * rotation metadata.
   *
   * @param unifiedPageNumber - The unified page number to extract
   * @throws {Error} If no files are loaded, page is not found, or file cannot be loaded
   * @example
   * ```typescript
   * await extractPage(5) // Extracts the 5th page in the unified page system
   * ```
   */
  const extractPage = React.useCallback(
    async (unifiedPageNumber: number): Promise<void> => {
      // Validate input
      if (!Number.isInteger(unifiedPageNumber) || unifiedPageNumber < 1) {
        onError(
          `Invalid page number: ${unifiedPageNumber}. Page number must be a positive integer.`
        );
        return;
      }

      if (pdfFiles.length === 0 || unifiedPages.length === 0) {
        onError(
          "No files loaded. Please add at least one file before extracting a page."
        );
        return;
      }

      // Use Map for O(1) lookup instead of O(n) Array.find()
      const pageMap = createPageMap(unifiedPages);
      const fileMap = createFileMap(pdfFiles);

      const page = pageMap.get(unifiedPageNumber);
      if (!page) {
        onError(`Page ${unifiedPageNumber} not found in unified pages.`);
        return;
      }

      const file = fileMap.get(page.fileId);
      if (!file) {
        onError(
          `File not found for page ${unifiedPageNumber} (fileId: ${page.fileId}).`
        );
        return;
      }

      if (isMountedRef.current) {
        setIsProcessing(true);
      }
      onError(null);

      try {
        // Wrap operations with timeout
        const pdf = await withTimeout(
          getCachedPdf(file.id, file.file, file.type),
          TIMEOUTS.FILE_LOAD_TIMEOUT,
          `Loading file '${file.file.name}' timed out. The file may be too large or corrupted.`
        );

        const pageIndex = page.originalPageNumber - 1;

        // Validate page index is within bounds
        if (pageIndex < 0 || pageIndex >= pdf.getPageCount()) {
          onError(
            `Page index ${pageIndex} is out of bounds for file '${file.file.name}' (has ${pdf.getPageCount()} pages).`
          );
          return;
        }

        // Calculate combined rotation (inherent + user-applied)
        // Read from ref to ensure we have the latest rotation state, avoiding stale closure issues
        const inherentRotation =
          file.inherentRotations?.[page.originalPageNumber] ?? 0;
        const userRotation = pageRotationsRef.current[unifiedPageNumber] ?? 0;
        const totalRotation = (inherentRotation + userRotation) % 360;
        const normalizedTotalRotation = normalizeRotation(totalRotation);

        // For images with 90/270 rotation, use content transformation instead of metadata rotation
        // This properly handles landscape-to-portrait conversions without white space
        const isImage = file.type === "image";
        const useContentTransform =
          isImage && needsContentTransform(normalizedTotalRotation);

        let newPdf: PDFDocument;

        if (useContentTransform && normalizedTotalRotation !== 0) {
          // For images needing content transformation, create a new PDF with properly rotated content
          newPdf = await PDFDocument.create();
          const sourcePage = pdf.getPage(pageIndex);

          await withTimeout(
            createRotatedImagePage(newPdf, sourcePage, normalizedTotalRotation),
            TIMEOUTS.OPERATION_TIMEOUT,
            "Rotating image timed out. Please try again."
          );
        } else {
          // For PDFs or images with 0/180 rotation, use the standard extraction flow
          newPdf = await withTimeout(
            extractPageFromPdf(pdf, pageIndex),
            TIMEOUTS.OPERATION_TIMEOUT,
            "Extracting page timed out. Please try again."
          );

          // Apply rotation metadata if needed (works for PDFs and 180° image rotation)
          if (totalRotation !== 0) {
            const newPage = newPdf.getPage(0);
            const originalPage = pdf.getPage(pageIndex);
            await withTimeout(
              applyPageRotation(originalPage, newPage, totalRotation, isImage),
              TIMEOUTS.OPERATION_TIMEOUT,
              "Applying rotation timed out. Please try again."
            );
          }
        }

        const pdfBytes = await withTimeout(
          newPdf.save(),
          TIMEOUTS.OPERATION_TIMEOUT,
          "Saving PDF timed out. Please try again."
        );
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        });

        // Remove file extension for base name (works for both PDF and image files)
        const baseName = file.file.name.replace(/\.[^/.]+$/, "");
        const dateStr = formatTimestamp();
        const filename = `${baseName}_page${page.originalPageNumber}_${dateStr}.pdf`;

        downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP);

        onError(null);
      } catch (err) {
        if (isMountedRef.current) {
          handleError(err, "Can't extract page:", onError);
        }
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [pdfFiles, unifiedPages, getCachedPdf, onError]
  );

  /**
   * Merges all active (non-deleted) pages from all files (PDFs and images) into a single PDF
   * and downloads it.
   *
   * Pages are merged in the order specified by pageOrder, excluding deleted pages.
   * User-applied rotations are preserved in the merged PDF. For images with 90°/270°
   * rotation, uses content transformation to properly handle landscape-to-portrait
   * conversions without white space. For PDFs and 180° rotations, uses standard
   * rotation metadata.
   *
   * Uses batch processing to prevent UI blocking: processes pages sequentially within
   * batches of 3-10 (depending on total page count), yielding to the browser between
   * batches to keep the UI responsive. Sequential processing within batches ensures
   * pages are added in the correct order as displayed in the UI.
   *
   * @throws {Error} If no files are loaded, all pages are deleted, or processing fails
   * @example
   * ```typescript
   * await downloadMerged() // Merges all active pages and triggers download
   * ```
   */
  const downloadMerged = React.useCallback(async (): Promise<void> => {
    if (pdfFiles.length === 0 || unifiedPages.length === 0) {
      onError(
        "Cannot download. No files loaded. Please add at least one file before downloading."
      );
      return;
    }

    const activePages = pageOrder.filter(
      (pageNum) => !deletedPages.has(pageNum)
    );
    if (activePages.length === 0) {
      onError(
        "Cannot download. All pages are deleted. At least one page must remain in the document."
      );
      return;
    }

    if (isMountedRef.current) {
      setIsProcessing(true);
    }
    onError(null);

    try {
      // Capture current rotation state at the start of export to ensure consistency
      // throughout the async operation. This prevents race conditions where rotations
      // are updated during the export process.
      const currentRotations = pageRotationsRef.current;

      // Create single merged PDF
      const mergedPdf = await PDFDocument.create();

      // Create lookup maps for O(1) access instead of O(n) Array.find()
      const pageMap = createPageMap(unifiedPages);
      const fileMap = createFileMap(pdfFiles);

      // Calculate optimal batch size using utility function
      // Batch processing strategy: process pages in small batches (3-10 pages)
      // to prevent UI blocking. Smaller batches for large documents maintain
      // responsiveness, while larger batches improve throughput for smaller documents.
      const totalPages: number = activePages.length;
      const BATCH_SIZE: number = calculateBatchSize(totalPages);

      // Process pages in batches, yielding to browser between batches
      const batchErrors: Array<{ pageNum: number; error: string }> = [];
      const totalBatches = Math.ceil(activePages.length / BATCH_SIZE);

      for (let i = 0; i < activePages.length; i += BATCH_SIZE) {
        const batch = activePages.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        // Process pages sequentially within each batch to maintain correct order
        // Pages must be added to the merged PDF in the exact order they appear in the UI
        // Parallel processing would cause race conditions where pages complete out of order
        for (const unifiedPageNum of batch) {
          const page = pageMap.get(unifiedPageNum);
          if (!page) {
            batchErrors.push({
              pageNum: unifiedPageNum,
              error: `Page ${unifiedPageNum} not found in unified pages.`,
            });
            logger.error(
              `Page ${unifiedPageNum} not found in batch ${batchNumber}`
            );
            continue;
          }

          const file = fileMap.get(page.fileId);
          if (!file) {
            batchErrors.push({
              pageNum: unifiedPageNum,
              error: `File not found for page ${unifiedPageNum} (fileId: ${page.fileId}).`,
            });
            logger.error(
              `File not found for page ${unifiedPageNum} in batch ${batchNumber}`
            );
            continue;
          }

          // Validate file has required properties
          if (!file.id || !file.file || !file.type) {
            batchErrors.push({
              pageNum: unifiedPageNum,
              error: `Invalid file data for page ${unifiedPageNum}`,
            });
            logger.error(
              `Invalid file data for page ${unifiedPageNum} in batch ${batchNumber}`
            );
            continue;
          }

          try {
            // Get cached PDF (for images, this is the converted PDF)
            const pdf = await withTimeout(
              getCachedPdf(file.id, file.file, file.type),
              TIMEOUTS.FILE_LOAD_TIMEOUT,
              `Loading file '${file.file.name}' for page ${unifiedPageNum} timed out after ${TIMEOUTS.FILE_LOAD_TIMEOUT}ms.`
            );
            const pageIndex = page.originalPageNumber - 1;

            // Calculate combined rotation (inherent + user-applied)
            // Use captured rotations snapshot to ensure consistency across all pages in the export
            const inherentRotation =
              file.inherentRotations?.[page.originalPageNumber] ?? 0;
            const userRotation = currentRotations[unifiedPageNum] ?? 0;
            const totalRotation = (inherentRotation + userRotation) % 360;
            const normalizedTotalRotation = normalizeRotation(totalRotation);

            // For images with 90/270 rotation, use content transformation instead of metadata rotation
            // This properly handles landscape-to-portrait conversions without white space
            const isImage = file.type === "image";
            const useContentTransform =
              isImage && needsContentTransform(normalizedTotalRotation);

            if (useContentTransform && normalizedTotalRotation !== 0) {
              // For images needing content transformation, create a rotated page directly
              const sourcePage = pdf.getPage(pageIndex);
              await withTimeout(
                createRotatedImagePage(
                  mergedPdf,
                  sourcePage,
                  normalizedTotalRotation
                ),
                TIMEOUTS.OPERATION_TIMEOUT,
                `Rotating image page ${unifiedPageNum} timed out after ${TIMEOUTS.OPERATION_TIMEOUT}ms.`
              );
            } else {
              // For PDFs or images with 0/180 rotation, use the standard copy flow
              const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex]);
              mergedPdf.addPage(copiedPage);

              // Apply rotation metadata if needed (works for PDFs and 180° image rotation)
              if (totalRotation !== 0) {
                const newPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1);
                const originalPage = pdf.getPage(pageIndex);
                await withTimeout(
                  applyPageRotation(
                    originalPage,
                    newPage,
                    totalRotation,
                    isImage
                  ),
                  TIMEOUTS.OPERATION_TIMEOUT,
                  `Applying rotation to page ${unifiedPageNum} timed out after ${TIMEOUTS.OPERATION_TIMEOUT}ms.`
                );
              }
            }
          } catch (err) {
            const errorInfo = createPdfErrorInfo(
              err,
              `Can't process page ${unifiedPageNum} from '${file.file.name}':`
            );
            logger.error("Error processing page:", errorInfo);
            logger.error("File details:", {
              id: file.id,
              name: file.file.name,
              type: file.type,
              pageNum: unifiedPageNum,
            });
            batchErrors.push({
              pageNum: unifiedPageNum,
              error: errorInfo.message,
            });
          }
        }

        // Check if all pages in batch failed
        const batchPageNums = new Set(batch);
        const failedInBatch = batchErrors.filter((e) =>
          batchPageNums.has(e.pageNum)
        ).length;
        if (failedInBatch === batch.length) {
          const errorInfo = createPdfErrorInfo(
            new Error(`All pages in batch ${batchNumber} failed.`),
            `Batch ${batchNumber}/${totalBatches} processing failed:`
          );
          logger.error("Batch processing error:", errorInfo);
          throw errorInfo;
        }

        // Yield to browser between batches to prevent UI blocking
        // This allows the browser to update the UI, handle user interactions,
        // and prevents the page from appearing frozen during large merges
        if (i + BATCH_SIZE < activePages.length) {
          await yieldToBrowser(100);
        }
      }

      // Report any page-level errors that occurred but didn't stop processing
      if (batchErrors.length > 0) {
        logger.warn(
          `${batchErrors.length} page(s) failed during processing:`,
          batchErrors
        );
        // Continue processing - some pages may have succeeded
      }

      const pdfBytes = await withTimeout(
        mergedPdf.save(),
        TIMEOUTS.OPERATION_TIMEOUT,
        "Saving merged PDF timed out. Please try again."
      );
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });

      const dateStr = formatTimestamp();
      const filename = `helvety-pdf_${dateStr}.pdf`;

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP);

      if (isMountedRef.current) {
        onError(null);
      }
    } catch (err) {
      // Standardized error handling - handleError already sets appropriate error message
      if (isMountedRef.current) {
        handleError(err, "Download failed:", onError);
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [pdfFiles, unifiedPages, pageOrder, deletedPages, getCachedPdf, onError]);

  return {
    isProcessing,
    extractPage,
    downloadMerged,
  };
}
