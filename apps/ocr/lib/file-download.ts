import { downloadBlob as downloadBlobShared } from "@helvety/shared/file-download";

import { OCR_FILENAME_LIMITS } from "./constants";

/**
 * Downloads a blob as a file with automatic cleanup of the blob URL.
 * Filenames are sanitized to prevent path traversal attacks.
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  cleanupDelay: number = 100
): void {
  downloadBlobShared(
    blob,
    filename,
    {
      maxLength: OCR_FILENAME_LIMITS.MAX_LENGTH,
      defaultName: OCR_FILENAME_LIMITS.DEFAULT_NAME,
    },
    cleanupDelay
  );
}

/**
 * Derives the download filename for extracted text from the source file name.
 * Strips the original extension and appends `-ocr.txt`.
 *
 * @example
 * createOcrDownloadName("report.pdf") // "report-ocr.txt"
 * createOcrDownloadName("scan.png")   // "scan-ocr.txt"
 */
export function createOcrDownloadName(originalName: string): string {
  const trimmed = originalName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const base = dotIndex > 0 ? trimmed.substring(0, dotIndex) : trimmed;
  const safeBase = base.trim() || OCR_FILENAME_LIMITS.DEFAULT_NAME;
  return `${safeBase}-ocr.txt`;
}
