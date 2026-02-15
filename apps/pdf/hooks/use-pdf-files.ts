// React
import * as React from "react";

// External libraries

// Internal utilities
import { isMobileDevice } from "@/hooks/use-is-mobile";
import { yieldToBrowserIfNeeded } from "@/lib/batch-processing";
import { safeRevokeObjectURL } from "@/lib/blob-url-utils";
import { FILE_LIMITS } from "@/lib/constants";
import { formatValidationErrors } from "@/lib/error-formatting";
import { processFile } from "@/lib/file-processing";
import { logger } from "@/lib/logger";
import { convertImageToPdf } from "@/lib/pdf-conversion";
import { createPdfErrorInfo, PdfErrorType } from "@/lib/pdf-errors";
import { loadPdfFromFile } from "@/lib/pdf-loading";
import { validateFiles, generateUniqueFileName } from "@/lib/validation-utils";

// Types
import type { PdfFile, UnifiedPage } from "@/lib/types";
import type { PDFDocument } from "pdf-lib";

/** Return type of usePdfFiles: file state, page order, handlers, and cache access. */
interface UsePdfFilesReturn {
  readonly pdfFiles: ReadonlyArray<PdfFile>;
  readonly setPdfFiles: React.Dispatch<React.SetStateAction<PdfFile[]>>;
  readonly unifiedPages: ReadonlyArray<UnifiedPage>;
  readonly pageOrder: ReadonlyArray<number>;
  readonly setPageOrder: React.Dispatch<React.SetStateAction<number[]>>;
  readonly pdfCacheRef: React.MutableRefObject<Map<string, PDFDocument>>;
  readonly validateAndAddFiles: (
    files: FileList | ReadonlyArray<File>,
    onError: (error: string | null) => void
  ) => Promise<void>;
  readonly removeFile: (fileId: string) => void;
  readonly clearAll: () => void;
  readonly getCachedPdf: (
    fileId: string,
    file: File,
    fileType: "pdf" | "image"
  ) => Promise<PDFDocument>;
}

/** Maximum number of retry attempts for transient failures */
const MAX_RETRIES = 2;

/**
 * Applies rate limiting between uploads.
 * Returns after enforcing minimum delay between uploads.
 *
 * @param lastUploadTimeRef - Ref to track last upload timestamp
 */
async function enforceRateLimiting(
  lastUploadTimeRef: React.MutableRefObject<number>
): Promise<void> {
  const now = Date.now();
  const timeSinceLastUpload = now - lastUploadTimeRef.current;
  if (timeSinceLastUpload < FILE_LIMITS.UPLOAD_RATE_LIMIT) {
    const delay = FILE_LIMITS.UPLOAD_RATE_LIMIT - timeSinceLastUpload;
    await new Promise<void>((resolve: () => void) =>
      setTimeout(resolve, delay)
    );
  }
  lastUploadTimeRef.current = Date.now();
}

/**
 * Determines if an error is retryable based on its type.
 * Network, timeout, and unknown errors are retryable.
 * Corrupted or invalid file errors are not.
 *
 * @param error - The error string to check
 * @param fileName - The file name for error context
 * @returns True if the error is retryable
 */
function isRetryableError(error: string, fileName: string): boolean {
  const errorInfo = createPdfErrorInfo(
    new Error(error),
    `Processing '${fileName}':`
  );
  return (
    errorInfo.type === PdfErrorType.NETWORK ||
    errorInfo.type === PdfErrorType.TIMEOUT ||
    errorInfo.type === PdfErrorType.UNKNOWN
  );
}

/**
 * Enhances error messages with helpful suggestions for memory-related issues.
 *
 * @param errorMessage - The original error message
 * @returns Enhanced error message with suggestions if applicable
 */
function enhanceErrorMessage(errorMessage: string): string {
  const isMemoryRelated =
    errorMessage.includes("memory") ||
    errorMessage.includes("allocation") ||
    errorMessage.includes("out of memory") ||
    errorMessage.toLowerCase().includes("quota");

  if (isMemoryRelated) {
    return `${errorMessage} The file may be too large for your device's available memory. Try closing other browser tabs or processing fewer files at once.`;
  }
  return errorMessage;
}

/**
 * Processes a single file with retry logic for transient failures.
 *
 * @param file - The file to process
 * @param fileIndex - Index for color assignment
 * @param pdfCache - Cache map for PDFDocuments
 * @param isMobile - Whether device is mobile (affects yielding)
 * @returns Processed PdfFile or error message
 */
async function processFileWithRetry(
  file: File,
  fileIndex: number,
  pdfCache: Map<string, PDFDocument>,
  isMobile: boolean
): Promise<{ pdfFile: PdfFile } | { error: string }> {
  let result = await processFile(file, fileIndex, pdfCache, isMobile);
  let retryCount = 0;

  while ("error" in result && retryCount < MAX_RETRIES) {
    if (!isRetryableError(result.error, file.name)) {
      break; // Don't retry for corrupted/invalid files
    }

    retryCount++;
    logger.log(
      `Retrying file '${file.name}' (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`
    );

    // Yield before retry to give browser time to recover
    await yieldToBrowserIfNeeded(file.size, isMobile, true);

    result = await processFile(file, fileIndex, pdfCache, isMobile);
  }

  if ("error" in result) {
    logger.error(
      `Failed to process file '${file.name}' after ${retryCount + 1} attempt(s):`,
      result.error
    );
    return { error: enhanceErrorMessage(result.error) };
  }

  return result;
}

/**
 * Creates a unified pages array from files (PDFs and images), assigning sequential page numbers
 * across all files. Images are treated as single-page documents.
 *
 * @param files - Array of files (PDFs and images) to process
 * @returns Array of unified pages with sequential numbering
 *
 * @example
 * ```typescript
 * const pages = createUnifiedPages([pdfFile1, pdfFile2])
 * // Returns: [{ id: 'file1-page-1', fileId: 'file1', ... }, ...]
 * ```
 */
function createUnifiedPages(files: ReadonlyArray<PdfFile>): UnifiedPage[] {
  const pages: UnifiedPage[] = [];
  let unifiedNumber = 1;

  for (const file of files) {
    for (let i = 1; i <= file.pageCount; i++) {
      pages.push({
        id: `${file.id}-page-${i}`,
        fileId: file.id,
        originalPageNumber: i,
        unifiedPageNumber: unifiedNumber++,
      });
    }
  }

  return pages;
}

/**
 * Custom hook for managing PDF files and their associated state.
 * Handles file validation, caching, and unified page management.
 * No file count or page limits - completely free, up to 100MB per file.
 *
 * @returns Object containing file state, handlers, and utilities
 */
export function usePdfFiles(): UsePdfFilesReturn {
  const [pdfFiles, setPdfFiles] = React.useState<PdfFile[]>([]);
  const [unifiedPages, setUnifiedPages] = React.useState<UnifiedPage[]>([]);
  const [pageOrder, setPageOrder] = React.useState<number[]>([]);
  const pdfCacheRef = React.useRef<Map<string, PDFDocument>>(new Map());
  const lastUploadTimeRef = React.useRef<number>(0);
  // Use ref to store current pdfFiles to avoid recreating validateAndAddFiles callback
  const pdfFilesRef = React.useRef<PdfFile[]>(pdfFiles);

  /**
   * Gets a cached PDF document or loads it if not in cache.
   * Caches the loaded PDF for future use to avoid redundant loading operations.
   * For images, re-converts them to PDF if cache is missing.
   *
   * @param fileId - The unique identifier of the file
   * @param file - The File object to load if not cached
   * @param fileType - File type ('pdf' | 'image') to determine loading strategy
   * @returns A promise that resolves to the PDFDocument
   * @throws {Error} If fileId is invalid, file is not found, or loading/conversion fails
   *
   * @example
   * ```typescript
   * const pdf = await getCachedPdf('file-123', file, 'pdf')
   * // Returns cached PDF or loads from file if not cached
   * ```
   */
  const getCachedPdf = React.useCallback(
    async (
      fileId: string,
      file: File,
      fileType: "pdf" | "image"
    ): Promise<PDFDocument> => {
      // Validate fileId
      if (!fileId || typeof fileId !== "string" || fileId.trim().length === 0) {
        throw new Error(
          `Invalid fileId provided: "${fileId}". File: "${file.name}"`
        );
      }

      // Validate file exists in current files list
      const currentFiles = pdfFilesRef.current;
      const fileExists = currentFiles.some((f) => f.id === fileId);
      if (!fileExists) {
        throw new Error(
          `File with ID "${fileId}" not found. File may have been removed. Original file: "${file.name}"`
        );
      }

      const cached = pdfCacheRef.current.get(fileId);
      if (cached) {
        // Update LRU access order by moving to end (most recently used)
        // This prevents frequently accessed items from being evicted
        pdfCacheRef.current.delete(fileId);
        pdfCacheRef.current.set(fileId, cached);
        logger.log(
          `Retrieved cached PDF for ${fileType} file: "${file.name}" (ID: ${fileId})`
        );
        return cached;
      }

      // For images, try to re-convert if cache is missing (fallback)
      // This can happen if cache was cleared or file was uploaded before caching was implemented
      if (fileType === "image") {
        logger.warn(
          `Cache miss for image: "${file.name}" (ID: ${fileId}). Re-converting...`
        );
        logger.warn(
          "Available cache keys:",
          Array.from(pdfCacheRef.current.keys())
        );
        try {
          // Re-convert the image to PDF
          const pdf = await convertImageToPdf(file);
          pdfCacheRef.current.set(fileId, pdf);
          logger.log(
            `Re-converted and cached image: "${file.name}" (ID: ${fileId})`
          );
          return pdf;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          throw new Error(
            `Failed to convert image to PDF: "${file.name}" (ID: ${fileId}). ${errorMessage}`
          );
        }
      }

      // For PDFs, load from file
      try {
        const pdf = await loadPdfFromFile(file);
        pdfCacheRef.current.set(fileId, pdf);
        logger.log(`Loaded and cached PDF: "${file.name}" (ID: ${fileId})`);
        return pdf;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Failed to load PDF: "${file.name}" (ID: ${fileId}). ${errorMessage}`
        );
      }
    },
    []
  );

  /**
   * Validates and adds PDF files and images to the application state.
   *
   * Performs validation checks, rate limiting, and progressive processing
   * with retry logic for transient failures. No file or page limits.
   *
   * @param files - FileList or array of File objects to validate and add
   * @param onError - Callback function to handle errors
   */
  const validateAndAddFiles = React.useCallback(
    async (
      files: FileList | ReadonlyArray<File>,
      onError: (error: string | null) => void
    ): Promise<void> => {
      const fileArray = Array.from(files);
      const isMobile = isMobileDevice();
      const currentPdfFiles = pdfFilesRef.current;

      // Enforce rate limiting between uploads
      await enforceRateLimiting(lastUploadTimeRef);

      // Validate files before processing
      const validationResult = validateFiles(fileArray, currentPdfFiles);
      if (!validationResult.valid) {
        onError(formatValidationErrors(validationResult.errors));
        return;
      }

      // Process all files and collect results
      const pdfFilesToAdd: PdfFile[] = [];
      const validationErrors: string[] = [];
      // Track names used in this batch to handle duplicates within the same upload
      const usedNamesInBatch = new Set<string>();

      for (let i = 0; i < fileArray.length; i++) {
        const originalFile = fileArray[i];
        if (!originalFile) continue;
        let file: File = originalFile;
        const fileIndex = currentPdfFiles.length + pdfFilesToAdd.length;

        // Generate unique filename if this is a duplicate
        const uniqueName = generateUniqueFileName(
          file.name,
          currentPdfFiles,
          usedNamesInBatch
        );
        if (uniqueName !== file.name) {
          // Create a new File object with the unique name
          file = new File([file], uniqueName, { type: file.type });
          logger.log(
            `Renamed duplicate file '${originalFile.name}' to '${uniqueName}'`
          );
        }
        usedNamesInBatch.add(uniqueName);

        // Yield to browser before processing (important for large files and mobile)
        await yieldToBrowserIfNeeded(file.size, isMobile, i > 0);

        const result = await processFileWithRetry(
          file,
          fileIndex,
          pdfCacheRef.current,
          isMobile
        );

        if ("error" in result) {
          validationErrors.push(result.error);
        } else {
          pdfFilesToAdd.push(result.pdfFile);
          logger.log(
            `Successfully processed file '${file.name}' (${i + 1}/${fileArray.length})`
          );
        }

        // Yield after processing to keep UI responsive
        if (i < fileArray.length - 1) {
          await yieldToBrowserIfNeeded(file.size, isMobile, true);
        }
      }

      // Update state with successfully processed files
      if (pdfFilesToAdd.length > 0 && validationErrors.length === 0) {
        setPdfFiles((prev) => [...prev, ...pdfFilesToAdd]);
      }

      // Report errors or clear error state
      if (validationErrors.length > 0) {
        onError(formatValidationErrors(validationErrors));
      } else if (pdfFilesToAdd.length > 0 || fileArray.length > 0) {
        onError(null);
      }
    },
    []
  ); // Using ref instead of pdfFiles dependency for better performance

  // Keep ref in sync with state
  React.useEffect(() => {
    pdfFilesRef.current = pdfFiles;
  }, [pdfFiles]);

  // Cleanup on unmount to prevent memory leaks
  React.useEffect(() => {
    // Capture refs at effect creation time to avoid stale closure in cleanup
    const cacheRef = pdfCacheRef;
    const filesRef = pdfFilesRef;

    return () => {
      // Clear PDF cache on unmount
      cacheRef.current.clear();
      logger.log("PDF cache cleared on unmount");

      // Revoke all blob URLs for current files
      filesRef.current.forEach((file: PdfFile) => {
        safeRevokeObjectURL(file.url);
      });
    };
  }, []);

  // Update unified pages when files change
  React.useEffect(() => {
    if (pdfFiles.length > 0) {
      const newUnifiedPages = createUnifiedPages(pdfFiles);
      setUnifiedPages(newUnifiedPages);
      // Initialize page order as sequential
      setPageOrder(newUnifiedPages.map((p) => p.unifiedPageNumber));
    } else {
      setUnifiedPages([]);
      setPageOrder([]);
    }
  }, [pdfFiles]);

  const removeFile = React.useCallback((fileId: string): void => {
    setPdfFiles((prev: PdfFile[]) => {
      const file: PdfFile | undefined = prev.find(
        (f: PdfFile) => f.id === fileId
      );
      if (file) {
        safeRevokeObjectURL(file.url);
      }
      // Clear PDF from cache
      pdfCacheRef.current.delete(fileId);
      return prev.filter((f: PdfFile) => f.id !== fileId);
    });
  }, []);

  const clearAll = React.useCallback((): void => {
    setPdfFiles((prev: PdfFile[]) => {
      // Clean up all blob URLs
      prev.forEach((file: PdfFile) => {
        safeRevokeObjectURL(file.url);
      });
      // Clear PDF cache
      pdfCacheRef.current.clear();
      return [];
    });
    setUnifiedPages([]);
    setPageOrder([]);
  }, []);

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
  };
}
