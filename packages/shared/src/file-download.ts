/**
 * Browser blob download helpers with path-safe filename sanitization.
 * Client-only (uses `document` / `URL.createObjectURL`).
 */

/** Limits applied when sanitizing download filenames. */
export interface DownloadFilenameLimits {
  readonly maxLength: number;
  readonly defaultName: string;
}

/**
 * Sanitizes a filename to prevent path traversal and other security issues.
 * Removes path separators, null bytes, and other dangerous characters.
 */
export function sanitizeDownloadFilename(
  filename: string,
  limits: DownloadFilenameLimits
): string {
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\0/g, "")
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim();

  if (sanitized.length > limits.maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized = name.substring(0, limits.maxLength - ext.length) + ext;
  }

  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = limits.defaultName;
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
  limits: DownloadFilenameLimits,
  cleanupDelay: number = 100
): void {
  const sanitizedFilename = sanitizeDownloadFilename(filename, limits);
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
