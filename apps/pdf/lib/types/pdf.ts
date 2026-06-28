/**
 * Represents a file (PDF or image) that has been uploaded and processed.
 * Images are converted to single-page PDFs internally, but the original type is preserved.
 *
 * @property id - Unique identifier for the file (generated using timestamp and random string)
 * @property file - The original File object from the user's upload
 * @property url - Blob URL for preview/display purposes
 * @property pageCount - Number of pages in the file (1 for images, actual count for PDFs)
 * @property color - OKLCH color string used for visual identification of the file
 * @property type - Discriminator indicating whether the source file was a PDF or image
 */
export interface PdfFile {
  readonly id: string;
  readonly file: File;
  readonly url: string;
  readonly pageCount: number;
  readonly color: string;
  readonly type: "pdf" | "image";
  /** Maps original page number (1-based) to inherent rotation angle from PDF metadata */
  readonly inherentRotations?: Readonly<Record<number, number>>;
}

/**
 * Represents a page in the unified page system.
 * Pages from all files are numbered sequentially across all files.
 *
 * @property id - Unique identifier for this page (format: "{fileId}-page-{pageNumber}")
 * @property fileId - The ID of the file this page belongs to
 * @property originalPageNumber - The original 1-based page number within the source file
 * @property unifiedPageNumber - The 1-based position in the unified page array across all files
 */
export interface UnifiedPage {
  readonly id: string;
  readonly fileId: string;
  readonly originalPageNumber: number;
  readonly unifiedPageNumber: number;
}

/**
 * Result type for file processing operations.
 * Used by processFile and related functions.
 */
export type ProcessFileResult =
  { readonly pdfFile: PdfFile } | { readonly error: string };

/**
 * Validation result for file validation operations.
 *
 * @property valid - Whether all files passed validation
 * @property errors - Array of error messages for invalid files
 */
export interface FileValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Memory information from the Performance API (if available).
 * Chrome/Edge specific - not available in all browsers.
 */
export interface MemoryInfo {
  /** Total JS heap size limit (bytes) */
  readonly jsHeapSizeLimit?: number;
  /** Total allocated heap size (bytes) */
  readonly totalJSHeapSize?: number;
  /** Used JS heap size (bytes) */
  readonly usedJSHeapSize?: number;
}
