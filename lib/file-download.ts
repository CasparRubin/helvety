// Internal utilities
import { FILENAME_LIMITS } from "./constants";

/**
 * Sanitizes a filename to prevent path traversal and other security issues.
 * Removes path separators, null bytes, and other dangerous characters.
 *
 * @param filename - The filename to sanitize
 * @returns A sanitized filename safe for use in downloads
 */
function sanitizeFilename(filename: string): string {
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\0/g, "")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim();

  if (sanitized.length > FILENAME_LIMITS.MAX_LENGTH) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized =
      name.substring(0, FILENAME_LIMITS.MAX_LENGTH - ext.length) + ext;
  }

  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = FILENAME_LIMITS.DEFAULT_NAME;
  }

  return sanitized;
}

/**
 * Downloads a blob as a file with automatic cleanup of the blob URL.
 *
 * Filenames are sanitized to prevent path traversal attacks and other security issues.
 *
 * @param blob - The blob to download
 * @param filename - The filename for the downloaded file (will be sanitized)
 * @param cleanupDelay - Delay in milliseconds before revoking the blob URL (default: 100ms)
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
