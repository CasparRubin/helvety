/** User-facing file size limits for browser-local utility apps. */
export const PDF_FILE_SIZE_LIMIT_COPY = "up to 100 MB per file" as const;

/** Maximum accepted file size for PDF and OCR zones, in bytes. */
export const PDF_FILE_SIZE_LIMIT_BYTES = 100 * 1024 * 1024;

/** Soft cap on concurrently open files in Helvety PDF (memory safeguard). */
export const PDF_MAX_OPEN_FILES = 20;

/** Soft cap on pages per uploaded PDF/image document in Helvety PDF. */
export const PDF_MAX_PAGES_PER_FILE = 200;

/** User-facing Helvety PDF workspace limits (size + open files + pages). */
export const PDF_WORKSPACE_LIMITS_COPY =
  "up to 100 MB per file, 20 open files, 200 pages per file" as const;

/** User-facing file size limits for browser-local utility apps. */
export const IMAGE_FILE_SIZE_LIMIT_COPY = "up to 25 MB per image" as const;

/** User-facing page cap for Helvety OCR PDFs. */
export const OCR_PDF_PAGE_LIMIT_COPY = "50 PDF pages" as const;
