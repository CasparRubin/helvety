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
  readonly id: string
  readonly file: File
  readonly url: string
  readonly pageCount: number
  readonly color: string
  readonly type: 'pdf' | 'image'
  /** Maps original page number (1-based) to inherent rotation angle from PDF metadata */
  readonly inherentRotations?: Readonly<Record<number, number>>
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
  readonly id: string
  readonly fileId: string
  readonly originalPageNumber: number
  readonly unifiedPageNumber: number
}

/**
 * File type discriminator for PDF and image files.
 * Used throughout the application to determine how to process files.
 */
export type FileType = 'pdf' | 'image'

/**
 * Validation result for file type checking.
 * 
 * @property valid - Whether the file type is valid and supported
 * @property error - Optional error message if validation failed
 */
export interface FileTypeValidation {
  readonly valid: boolean
  readonly error?: string
}

/**
 * Validation result for file size checking.
 * 
 * @property valid - Whether the file size is within acceptable limits
 * @property error - Optional error message if validation failed
 */
export interface FileSizeValidation {
  readonly valid: boolean
  readonly error?: string
}

