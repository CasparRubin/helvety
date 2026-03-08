/* eslint-disable jsdoc/require-jsdoc */

/// <reference lib="webworker" />

import { PDFDocument } from "pdf-lib";

import { convertImageToPdf } from "../lib/pdf-conversion";
import {
  applyPageRotation,
  createRotatedImagePage,
  needsContentTransform,
  normalizeRotation,
} from "../lib/pdf-rotation";

import type {
  ExtractPageResponsePayload,
  MergeResponsePayload,
  WorkerRequest,
  WorkerResponse,
  WorkerSourceFile,
  WorkerUnifiedPage,
} from "../lib/pdf-processing-worker-types";

const workerScope: DedicatedWorkerGlobalScope =
  self as DedicatedWorkerGlobalScope;
const cancelledRequestIds = new Set<string>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const view = new Uint8Array(bytes.byteLength);
  view.set(bytes);
  return view.buffer;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ensureNotCancelled(requestId: string): void {
  if (cancelledRequestIds.has(requestId)) {
    throw new Error("Operation cancelled");
  }
}

function calculateWorkerBatchSize(totalPages: number): number {
  if (totalPages <= 25) {
    return 10;
  }

  if (totalPages <= 100) {
    return 6;
  }

  return 4;
}

async function yieldToWorkerEventLoop(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function loadSourcePdf(
  sourceFile: WorkerSourceFile,
  useGpuPreprocess: boolean
): Promise<PDFDocument> {
  if (sourceFile.type === "pdf") {
    return PDFDocument.load(sourceFile.bytes.slice(0));
  }

  if (typeof File === "undefined") {
    throw new Error("Image conversion is unavailable in this browser worker");
  }

  const imageFile = new File([sourceFile.bytes.slice(0)], sourceFile.name, {
    type: sourceFile.mimeType || "image/png",
  });
  return convertImageToPdf(imageFile, {
    preferGpuPreprocess: useGpuPreprocess,
  });
}

async function extractPage(
  requestId: string,
  request: Extract<WorkerRequest, { kind: "extract-page" }>
): Promise<ExtractPageResponsePayload> {
  ensureNotCancelled(requestId);

  const sourcePdf = await loadSourcePdf(
    request.payload.sourceFile,
    request.options.useGpuPreprocess
  );
  ensureNotCancelled(requestId);

  const mergedPdf = await PDFDocument.create();
  const sourcePageIndex = request.payload.originalPageNumber - 1;
  const sourcePage = sourcePdf.getPage(sourcePageIndex);
  const normalizedRotation = normalizeRotation(request.payload.userRotation);

  if (
    request.payload.sourceFile.type === "image" &&
    needsContentTransform(normalizedRotation) &&
    normalizedRotation !== 0
  ) {
    await createRotatedImagePage(mergedPdf, sourcePage, normalizedRotation);
  } else {
    const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [
      sourcePageIndex,
    ]);
    mergedPdf.addPage(copiedPage);

    if (request.payload.userRotation !== 0) {
      const targetPage = mergedPdf.getPage(0);
      await applyPageRotation(
        sourcePage,
        targetPage,
        request.payload.userRotation,
        request.payload.sourceFile.type === "image"
      );
    }
  }

  const bytes = await mergedPdf.save();
  return { bytes: toArrayBuffer(bytes) };
}

function createPageMap(
  pages: ReadonlyArray<WorkerUnifiedPage>
): Map<number, WorkerUnifiedPage> {
  const map = new Map<number, WorkerUnifiedPage>();
  for (const page of pages) {
    map.set(page.unifiedPageNumber, page);
  }
  return map;
}

async function mergePages(
  requestId: string,
  request: Extract<WorkerRequest, { kind: "merge-pages" }>
): Promise<MergeResponsePayload> {
  const mergedPdf = await PDFDocument.create();
  const fileMap = new Map(request.payload.files.map((file) => [file.id, file]));
  const pageMap = createPageMap(request.payload.pages);
  const failedPages: Array<{ pageNum: number; error: string }> = [];
  const sourcePdfCache = new Map<string, Promise<PDFDocument>>();

  const activePages = request.payload.activePageOrder;
  const batchSize = calculateWorkerBatchSize(activePages.length);
  const totalBatches = Math.ceil(activePages.length / batchSize);

  for (let i = 0; i < activePages.length; i += batchSize) {
    ensureNotCancelled(requestId);
    const batch = activePages.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    for (const unifiedPageNumber of batch) {
      ensureNotCancelled(requestId);
      const page = pageMap.get(unifiedPageNumber);
      if (!page) {
        failedPages.push({
          pageNum: unifiedPageNumber,
          error: "Page metadata not found",
        });
        continue;
      }

      const sourceFile = fileMap.get(page.fileId);
      if (!sourceFile) {
        failedPages.push({
          pageNum: unifiedPageNumber,
          error: "Source file metadata not found",
        });
        continue;
      }

      try {
        let sourcePdfPromise = sourcePdfCache.get(sourceFile.id);
        if (!sourcePdfPromise) {
          sourcePdfPromise = loadSourcePdf(
            sourceFile,
            request.options.useGpuPreprocess
          );
          sourcePdfCache.set(sourceFile.id, sourcePdfPromise);
        }

        const sourcePdf = await sourcePdfPromise;
        ensureNotCancelled(requestId);

        const pageIndex = page.originalPageNumber - 1;
        const sourcePage = sourcePdf.getPage(pageIndex);
        const inherentRotation =
          sourceFile.inherentRotations?.[page.originalPageNumber] ?? 0;
        const userRotation =
          request.payload.pageRotations[unifiedPageNumber] ?? 0;
        const totalRotation = normalizeRotation(
          inherentRotation + userRotation
        );

        if (
          sourceFile.type === "image" &&
          needsContentTransform(totalRotation) &&
          totalRotation !== 0
        ) {
          await createRotatedImagePage(mergedPdf, sourcePage, totalRotation);
        } else {
          const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [
            pageIndex,
          ]);
          mergedPdf.addPage(copiedPage);

          if (totalRotation !== 0) {
            const targetPage = mergedPdf.getPage(mergedPdf.getPageCount() - 1);
            await applyPageRotation(
              sourcePage,
              targetPage,
              totalRotation,
              sourceFile.type === "image"
            );
          }
        }
      } catch (error) {
        failedPages.push({
          pageNum: unifiedPageNumber,
          error: toErrorMessage(error),
        });
      }
    }

    const failedInBatch = failedPages.filter((pageError) =>
      batch.includes(pageError.pageNum)
    ).length;
    if (failedInBatch === batch.length) {
      throw new Error(
        `All pages in batch ${batchNumber}/${totalBatches} failed`
      );
    }

    if (i + batchSize < activePages.length) {
      await yieldToWorkerEventLoop();
    }
  }

  const bytes = await mergedPdf.save();
  return {
    bytes: toArrayBuffer(bytes),
    failedPages,
  };
}

async function handleRequest(
  request: WorkerRequest
): Promise<WorkerResponse | null> {
  if (request.kind === "cancel") {
    cancelledRequestIds.add(request.id);
    return null;
  }

  cancelledRequestIds.delete(request.id);

  try {
    if (request.kind === "extract-page") {
      const payload = await extractPage(request.id, request);
      ensureNotCancelled(request.id);
      return {
        id: request.id,
        ok: true,
        kind: "extract-page",
        payload,
      };
    }

    const payload = await mergePages(request.id, request);
    ensureNotCancelled(request.id);
    return {
      id: request.id,
      ok: true,
      kind: "merge-pages",
      payload,
    };
  } catch (error) {
    return {
      id: request.id,
      ok: false,
      error: toErrorMessage(error),
    };
  } finally {
    cancelledRequestIds.delete(request.id);
  }
}

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data).then((response) => {
    if (response) {
      workerScope.postMessage(response);
    }
  });
};
