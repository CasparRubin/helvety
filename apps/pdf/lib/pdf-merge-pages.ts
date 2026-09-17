import { logger } from "@helvety/shared/logger";

import { calculateBatchSize, yieldToBrowser } from "./batch-processing";
import { TIMEOUTS } from "./constants";
import { getMemoryUsagePercent } from "./memory-utils";
import { createPdfErrorInfo } from "./pdf-errors";
import { exportPageWithRotation } from "./pdf-rotation";
import { computeEffectiveRotation } from "./pdf-rotation-math";
import { withTimeoutAndSignal } from "./timeout-utils";

import type { PdfFile, UnifiedPage } from "./types";
import type { PDFDocument } from "pdf-lib";

/** User-facing copy when merge skips one or more pages. */
export function mergePartialFailureMessage(failedPageCount: number): string {
  return `${failedPageCount} page(s) could not be included in the download.`;
}

/** Shrinks merge batches when the browser reports high heap usage. */
function adaptMergeBatchSize(batchSize: number): number {
  const memoryUsagePercent = getMemoryUsagePercent();
  if (memoryUsagePercent !== null && memoryUsagePercent >= 85) {
    return Math.max(2, Math.floor(batchSize / 2));
  }

  if (memoryUsagePercent !== null && memoryUsagePercent >= 75) {
    return Math.max(3, Math.floor(batchSize * 0.75));
  }

  return batchSize;
}

/** Inputs for {@link mergePagesOnMainThread}. */
export interface MergePagesOnMainThreadParams {
  readonly signal: AbortSignal;
  readonly activePages: ReadonlyArray<number>;
  readonly currentRotations: Readonly<Record<number, number>>;
  readonly pageMap: ReadonlyMap<number, UnifiedPage>;
  readonly fileMap: ReadonlyMap<string, PdfFile>;
  readonly getCachedPdf: (
    fileId: string,
    file: File,
    fileType: "pdf" | "image"
  ) => Promise<PDFDocument>;
}

/** Merged PDF bytes plus per-page skip errors. */
export interface MergePagesOnMainThreadResult {
  readonly blob: Blob;
  readonly batchErrors: Array<{ pageNum: number; error: string }>;
}

/**
 * Merges active pages on the main thread. Failed pages are skipped so a
 * partial PDF can still download.
 */
export async function mergePagesOnMainThread({
  signal,
  activePages,
  currentRotations,
  pageMap,
  fileMap,
  getCachedPdf,
}: MergePagesOnMainThreadParams): Promise<MergePagesOnMainThreadResult> {
  const { PDFDocument } = await import("pdf-lib");
  const mergedPdf = await PDFDocument.create();
  const totalPages: number = activePages.length;
  const batchErrors: Array<{ pageNum: number; error: string }> = [];
  const baseBatchSize = calculateBatchSize(totalPages);
  const batchSize = adaptMergeBatchSize(baseBatchSize);
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
        const effectiveRotation = computeEffectiveRotation(
          inherentRotation,
          userRotation
        );
        const isImage = file.type === "image";

        await withTimeoutAndSignal(
          () =>
            exportPageWithRotation(
              mergedPdf,
              pdf,
              pageIndex,
              effectiveRotation,
              isImage
            ),
          TIMEOUTS.OPERATION_TIMEOUT,
          signal,
          `Processing page ${unifiedPageNum} timed out after ${TIMEOUTS.OPERATION_TIMEOUT}ms.`
        );
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
}
