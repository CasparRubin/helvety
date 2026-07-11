import { OCR_FILENAME_LIMITS } from "./constants";

/**
 * Sanitizes a filename to prevent path traversal and other issues.
 * Removes path separators, null bytes, and control characters.
 */
function sanitizeFilename(filename: string): string {
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\0/g, "")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim();

  if (sanitized.length > OCR_FILENAME_LIMITS.MAX_LENGTH) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized =
      name.substring(0, OCR_FILENAME_LIMITS.MAX_LENGTH - ext.length) + ext;
  }

  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = OCR_FILENAME_LIMITS.DEFAULT_NAME;
  }

  return sanitized;
}

/**
 * Downloads a blob as a file with automatic cleanup of the blob URL.
 * Filenames are sanitized to prevent path traversal attacks.
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  cleanupDelay: number = 100
): void {
  const sanitizedFilename = sanitizeFilename(filename);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = sanitizedFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, cleanupDelay);
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
