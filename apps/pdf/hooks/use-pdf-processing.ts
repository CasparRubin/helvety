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
import { getMemoryUsagePercent } from "@/lib/memory-utils";
import { createPdfErrorInfo } from "@/lib/pdf-errors";
import { extractPageFromPdf } from "@/lib/pdf-extraction";
import { formatTimestamp } from "@/lib/pdf-helpers";
import { createPageMap, createFileMap } from "@/lib/pdf-lookup-utils";
import { selectPdfProcessingPipeline } from "@/lib/pdf-processing-pipeline";
import { recordPipelineMetric } from "@/lib/pdf-processing-telemetry";
import { PdfProcessingWorkerClient } from "@/lib/pdf-processing-worker-client";
import {
  applyPageRotation,
  createRotatedImagePage,
  needsContentTransform,
  normalizeRotation,
} from "@/lib/pdf-rotation";
import { withTimeout, withTimeoutAndSignal } from "@/lib/timeout-utils";

// Types
import type { PdfProcessingPipeline } from "@/lib/pdf-processing-pipeline";
import type {
  WorkerSourceFile,
  WorkerUnifiedPage,
} from "@/lib/pdf-processing-worker-types";
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
  const workerClientRef = React.useRef<PdfProcessingWorkerClient | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const pipelineOverrideRef = React.useRef<PdfProcessingPipeline | null>(null);
  const pipelineSelection = React.useMemo(
    () => selectPdfProcessingPipeline(),
    []
  );

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
      abortControllerRef.current?.abort();
      workerClientRef.current?.dispose();
      workerClientRef.current = null;
    };
  }, []);

  const getActivePipeline = React.useCallback((): PdfProcessingPipeline => {
    return pipelineOverrideRef.current ?? pipelineSelection.pipeline;
  }, [pipelineSelection.pipeline]);

  const createAbortController = React.useCallback((): AbortController => {
    abortControllerRef.current?.abort();
    workerClientRef.current?.cancelAll();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return controller;
  }, []);

  const getWorkerClient = React.useCallback((): PdfProcessingWorkerClient => {
    workerClientRef.current ??= new PdfProcessingWorkerClient();
    return workerClientRef.current;
  }, []);

  const downgradeToMainThread = React.useCallback((reason: string): void => {
    logger.warn("Downgrading PDF processing pipeline to main-thread:", reason);
    pipelineOverrideRef.current = "main-thread";
  }, []);

  const adaptBatchSizeForMemory = React.useCallback(
    (batchSize: number): number => {
      const memoryUsagePercent = getMemoryUsagePercent();
      if (memoryUsagePercent !== null && memoryUsagePercent >= 85) {
        return Math.max(2, Math.floor(batchSize / 2));
      }

      if (memoryUsagePercent !== null && memoryUsagePercent >= 75) {
        return Math.max(3, Math.floor(batchSize * 0.75));
      }

      return batchSize;
    },
    []
  );

  const loadWorkerSourceFile = React.useCallback(
    async (file: PdfFile, signal: AbortSignal): Promise<WorkerSourceFile> => {
      const bytes = await withTimeoutAndSignal(
        () => file.file.arrayBuffer(),
        TIMEOUTS.FILE_LOAD_TIMEOUT,
        signal,
        `Loading source bytes for '${file.file.name}' timed out.`
      );

      return {
        id: file.id,
        name: file.file.name,
        type: file.type,
        mimeType: file.file.type,
        bytes,
        inherentRotations: file.inherentRotations,
      };
    },
    []
  );

  const extractPageMainThread = React.useCallback(
    async (
      unifiedPageNumber: number,
      signal: AbortSignal,
      pageMap: ReadonlyMap<number, UnifiedPage>,
      fileMap: ReadonlyMap<string, PdfFile>
    ): Promise<Blob> => {
      const page = pageMap.get(unifiedPageNumber);
      if (!page) {
        throw new Error(
          `Page ${unifiedPageNumber} not found in unified pages.`
        );
      }

      const file = fileMap.get(page.fileId);
      if (!file) {
        throw new Error(
          `File not found for page ${unifiedPageNumber} (fileId: ${page.fileId}).`
        );
      }

      const pdf = await withTimeoutAndSignal(
        () => getCachedPdf(file.id, file.file, file.type),
        TIMEOUTS.FILE_LOAD_TIMEOUT,
        signal,
        `Loading file '${file.file.name}' timed out. The file may be too large or corrupted.`
      );

      const pageIndex = page.originalPageNumber - 1;
      if (pageIndex < 0 || pageIndex >= pdf.getPageCount()) {
        throw new Error(
          `Page index ${pageIndex} is out of bounds for file '${file.file.name}' (has ${pdf.getPageCount()} pages).`
        );
      }

      const inherentRotation =
        file.inherentRotations?.[page.originalPageNumber] ?? 0;
      const userRotation = pageRotationsRef.current[unifiedPageNumber] ?? 0;
      const totalRotation = (inherentRotation + userRotation) % 360;
      const normalizedTotalRotation = normalizeRotation(totalRotation);
      const isImage = file.type === "image";
      const useContentTransform =
        isImage && needsContentTransform(normalizedTotalRotation);

      let newPdf: PDFDocument;

      if (useContentTransform && normalizedTotalRotation !== 0) {
        newPdf = await PDFDocument.create();
        const sourcePage = pdf.getPage(pageIndex);
        await withTimeoutAndSignal(
          () =>
            createRotatedImagePage(newPdf, sourcePage, normalizedTotalRotation),
          TIMEOUTS.OPERATION_TIMEOUT,
          signal,
          "Rotating image timed out. Please try again."
        );
      } else {
        newPdf = await withTimeoutAndSignal(
          () => extractPageFromPdf(pdf, pageIndex),
          TIMEOUTS.OPERATION_TIMEOUT,
          signal,
          "Extracting page timed out. Please try again."
        );

        if (totalRotation !== 0) {
          const newPage = newPdf.getPage(0);
          await withTimeoutAndSignal(
            () => applyPageRotation(newPage, totalRotation, isImage),
            TIMEOUTS.OPERATION_TIMEOUT,
            signal,
            "Applying rotation timed out. Please try again."
          );
        }
      }

      const pdfBytes = await withTimeoutAndSignal(
        () => newPdf.save(),
        TIMEOUTS.OPERATION_TIMEOUT,
        signal,
        "Saving PDF timed out. Please try again."
      );
      return new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });
    },
    [getCachedPdf]
  );

  const downloadMergedMainThread = React.useCallback(
    async (
      signal: AbortSignal,
      activePages: ReadonlyArray<number>,
      currentRotations: Readonly<Record<number, number>>,
      pageMap: ReadonlyMap<number, UnifiedPage>,
      fileMap: ReadonlyMap<string, PdfFile>
    ): Promise<{
      blob: Blob;
      batchErrors: Array<{ pageNum: number; error: string }>;
    }> => {
      const mergedPdf = await PDFDocument.create();
      const totalPages: number = activePages.length;
      const batchErrors: Array<{ pageNum: number; error: string }> = [];
      const baseBatchSize = calculateBatchSize(totalPages);
      const batchSize = adaptBatchSizeForMemory(baseBatchSize);
      const totalBatches = Math.ceil(activePages.length / batchSize);

      for (let i = 0; i < activePages.length; i += batchSize) {
        if (signal.aborted) {
          throw new Error("Operation cancelled");
        }

        const batch = activePages.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        for (const unifiedPageNum of batch) {
          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

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
            const pdf = await withTimeoutAndSignal(
              () => getCachedPdf(file.id, file.file, file.type),
              TIMEOUTS.FILE_LOAD_TIMEOUT,
              signal,
              `Loading file '${file.file.name}' for page ${unifiedPageNum} timed out after ${TIMEOUTS.FILE_LOAD_TIMEOUT}ms.`
            );
            const pageIndex = page.originalPageNumber - 1;

            const inherentRotation =
              file.inherentRotations?.[page.originalPageNumber] ?? 0;
            const userRotation = currentRotations[unifiedPageNum] ?? 0;
            const totalRotation = (inherentRotation + userRotation) % 360;
            const normalizedTotalRotation = normalizeRotation(totalRotation);

            const isImage = file.type === "image";
            const useContentTransform =
              isImage && needsContentTransform(normalizedTotalRotation);

            if (useContentTransform && normalizedTotalRotation !== 0) {
              const sourcePage = pdf.getPage(pageIndex);
              await withTimeoutAndSignal(
                () =>
                  createRotatedImagePage(
                    mergedPdf,
                    sourcePage,
                    normalizedTotalRotation
                  ),
                TIMEOUTS.OPERATION_TIMEOUT,
                signal,
                `Rotating image page ${unifiedPageNum} timed out after ${TIMEOUTS.OPERATION_TIMEOUT}ms.`
              );
            } else {
              const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex]);
              mergedPdf.addPage(copiedPage);

              if (totalRotation !== 0) {
                const newPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1);
                await withTimeoutAndSignal(
                  () => applyPageRotation(newPage, totalRotation, isImage),
                  TIMEOUTS.OPERATION_TIMEOUT,
                  signal,
                  `Applying rotation to page ${unifiedPageNum} timed out after ${TIMEOUTS.OPERATION_TIMEOUT}ms.`
                );
              }
            }
          } catch (err) {
            const errorInfo = createPdfErrorInfo(
              err,
              `Can't process page ${unifiedPageNum} from '${file.file.name}':`
            );
            logger.logUnexpectedError("Error processing page", errorInfo);
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

        const batchPageNums = new Set(batch);
        const failedInBatch = batchErrors.filter((e) =>
          batchPageNums.has(e.pageNum)
        ).length;
        if (failedInBatch === batch.length) {
          const errorInfo = createPdfErrorInfo(
            new Error(`All pages in batch ${batchNumber} failed.`),
            `Batch ${batchNumber}/${totalBatches} processing failed:`
          );
          logger.logUnexpectedError("Batch processing error", errorInfo);
          throw errorInfo;
        }

        if (i + batchSize < activePages.length) {
          await yieldToBrowser(100);
        }
      }

      const pdfBytes = await withTimeoutAndSignal(
        () => mergedPdf.save(),
        TIMEOUTS.OPERATION_TIMEOUT,
        signal,
        "Saving merged PDF timed out. Please try again."
      );

      return {
        blob: new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        }),
        batchErrors,
      };
    },
    [adaptBatchSizeForMemory, getCachedPdf]
  );

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
      const start = performance.now();
      const abortController = createAbortController();

      try {
        const pipeline = getActivePipeline();
        let blob: Blob;

        if (pipeline === "main-thread") {
          blob = await extractPageMainThread(
            unifiedPageNumber,
            abortController.signal,
            pageMap,
            fileMap
          );
        } else {
          try {
            const workerClient = getWorkerClient();
            const sourceFile = await loadWorkerSourceFile(
              file,
              abortController.signal
            );
            const inherentRotation =
              file.inherentRotations?.[page.originalPageNumber] ?? 0;
            const userRotation =
              pageRotationsRef.current[unifiedPageNumber] ?? 0;
            const response = await withTimeout(
              workerClient.postMessage({
                kind: "extract-page",
                options: {
                  useGpuPreprocess: pipeline === "gpu-worker",
                  useWorkerPipeline: true,
                },
                payload: {
                  sourceFile,
                  originalPageNumber: page.originalPageNumber,
                  unifiedPageNumber,
                  userRotation: normalizeRotation(
                    inherentRotation + userRotation
                  ),
                },
              }),
              TIMEOUTS.OPERATION_TIMEOUT,
              "Extracting page in worker timed out. Please try again."
            );

            if (!response.ok || response.kind !== "extract-page") {
              throw new Error(
                response.ok ? "Invalid worker extract response" : response.error
              );
            }

            blob = new Blob([new Uint8Array(response.payload.bytes)], {
              type: "application/pdf",
            });
          } catch (workerError) {
            downgradeToMainThread(
              workerError instanceof Error
                ? workerError.message
                : "Worker extract failed"
            );
            blob = await extractPageMainThread(
              unifiedPageNumber,
              abortController.signal,
              pageMap,
              fileMap
            );
          }
        }

        // Remove file extension for base name (works for both PDF and image files)
        const baseName = file.file.name.replace(/\.[^/.]+$/, "");
        const dateStr = formatTimestamp();
        const filename = `${baseName}_page${page.originalPageNumber}_${dateStr}.pdf`;

        downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP);

        onError(null);
        recordPipelineMetric({
          operation: "extract",
          pipeline: getActivePipeline(),
          durationMs: Math.round(performance.now() - start),
          success: true,
          pagesProcessed: 1,
        });
      } catch (err) {
        recordPipelineMetric({
          operation: "extract",
          pipeline: getActivePipeline(),
          durationMs: Math.round(performance.now() - start),
          success: false,
          pagesProcessed: 1,
          error: err instanceof Error ? err.message : String(err),
        });
        if (isMountedRef.current) {
          handleError(err, "Can't extract page:", onError);
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [
      createAbortController,
      downgradeToMainThread,
      extractPageMainThread,
      getActivePipeline,
      getWorkerClient,
      loadWorkerSourceFile,
      onError,
      pdfFiles,
      unifiedPages,
    ]
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
   * Processing strategy is pipeline-based:
   * - `worker` / `gpu-worker`: runs merge operations in a dedicated worker
   * - `main-thread`: runs adaptive batch processing on the UI thread with browser yields
   * Both paths preserve page order exactly as displayed in the UI.
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
    const start = performance.now();
    const abortController = createAbortController();

    try {
      // Capture current rotation state at the start of export to ensure consistency
      // throughout the async operation. This prevents race conditions where rotations
      // are updated during the export process.
      const currentRotations = pageRotationsRef.current;

      // Create lookup maps for O(1) access instead of O(n) Array.find()
      const pageMap = createPageMap(unifiedPages);
      const fileMap = createFileMap(pdfFiles);
      const pipeline = getActivePipeline();
      let blob: Blob;
      let batchErrors: Array<{ pageNum: number; error: string }> = [];

      if (pipeline === "main-thread") {
        const result = await downloadMergedMainThread(
          abortController.signal,
          activePages,
          currentRotations,
          pageMap,
          fileMap
        );
        blob = result.blob;
        batchErrors = result.batchErrors;
      } else {
        try {
          const workerClient = getWorkerClient();
          const workerFiles = await Promise.all(
            pdfFiles.map((pdfFile) =>
              loadWorkerSourceFile(pdfFile, abortController.signal)
            )
          );
          const workerPages: WorkerUnifiedPage[] = unifiedPages.map(
            (entry) => ({
              unifiedPageNumber: entry.unifiedPageNumber,
              fileId: entry.fileId,
              originalPageNumber: entry.originalPageNumber,
            })
          );

          const response = await withTimeout(
            workerClient.postMessage({
              kind: "merge-pages",
              options: {
                useGpuPreprocess: pipeline === "gpu-worker",
                useWorkerPipeline: true,
              },
              payload: {
                files: workerFiles,
                pages: workerPages,
                activePageOrder: activePages,
                pageRotations: currentRotations,
              },
            }),
            TIMEOUTS.OPERATION_TIMEOUT * 2,
            "Merging pages in worker timed out. Please try again."
          );

          if (!response.ok || response.kind !== "merge-pages") {
            throw new Error(
              response.ok ? "Invalid worker merge response" : response.error
            );
          }

          blob = new Blob([new Uint8Array(response.payload.bytes)], {
            type: "application/pdf",
          });
          batchErrors = [...response.payload.failedPages];
        } catch (workerError) {
          downgradeToMainThread(
            workerError instanceof Error
              ? workerError.message
              : "Worker merge failed"
          );
          const result = await downloadMergedMainThread(
            abortController.signal,
            activePages,
            currentRotations,
            pageMap,
            fileMap
          );
          blob = result.blob;
          batchErrors = result.batchErrors;
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

      const dateStr = formatTimestamp();
      const filename = `helvety-pdf_${dateStr}.pdf`;

      downloadBlob(blob, filename, DELAYS.BLOB_URL_CLEANUP);

      if (isMountedRef.current) {
        onError(null);
      }
      recordPipelineMetric({
        operation: "merge",
        pipeline: getActivePipeline(),
        durationMs: Math.round(performance.now() - start),
        success: true,
        pagesProcessed: activePages.length,
      });
    } catch (err) {
      recordPipelineMetric({
        operation: "merge",
        pipeline: getActivePipeline(),
        durationMs: Math.round(performance.now() - start),
        success: false,
        pagesProcessed: activePages.length,
        error: err instanceof Error ? err.message : String(err),
      });
      // Standardized error handling - handleError already sets appropriate error message
      if (isMountedRef.current) {
        handleError(err, "Download failed:", onError);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [
    createAbortController,
    deletedPages,
    downloadMergedMainThread,
    downgradeToMainThread,
    getActivePipeline,
    getWorkerClient,
    loadWorkerSourceFile,
    onError,
    pageOrder,
    pdfFiles,
    unifiedPages,
  ]);

  return {
    isProcessing,
    extractPage,
    downloadMerged,
  };
}
