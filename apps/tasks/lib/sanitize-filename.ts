/**
 * Filename sanitization utility
 *
 * Prevents path traversal, XSS via control characters, and other security
 * issues when using filenames from decrypted metadata in download attributes
 * or display contexts.
 */

/** Maximum allowed filename length (Windows limit is 255, be conservative) */
const MAX_FILENAME_LENGTH = 200;

/** Default filename when sanitization results in empty or invalid name */
const DEFAULT_FILENAME = "download";

/**
 * Sanitizes a filename to prevent path traversal and other security issues.
 * Removes path separators, null bytes, control characters, and other
 * dangerous characters. Truncates to a safe length while preserving extension.
 *
 * @param filename - The filename to sanitize (e.g. from decrypted metadata)
 * @returns A sanitized filename safe for use in downloads and display
 */
export function sanitizeFilename(filename: string): string {
  let sanitized = filename
    // Remove path separators, special filesystem characters
    .replace(/[/\\?%*:|"<>]/g, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters (C0 and C1 ranges)
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim();

  // Truncate while preserving extension
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const dotIndex = sanitized.lastIndexOf(".");
    if (dotIndex > 0) {
      const ext = sanitized.substring(dotIndex);
      const name = sanitized.substring(0, dotIndex);
      sanitized = name.substring(0, MAX_FILENAME_LENGTH - ext.length) + ext;
    } else {
      sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
    }
  }

  // Reject empty, dot-only, or path-traversal names
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = DEFAULT_FILENAME;
  }

  return sanitized;
}
