/**
 * Represents a file (PDF or image) that has been uploaded and processed.
 * Images are converted to single-page PDFs internally, but the original type is preserved.
 */
export interface PdfFile {
  id: string
  file: File
  url: string
  pageCount: number
  color: string
  type: 'pdf' | 'image' // Required field to track source file type
}

export interface UnifiedPage {
  id: string // Unique ID for this page in unified array
  fileId: string // Which file this page belongs to
  originalPageNumber: number // Original page number in the file (1-based)
  unifiedPageNumber: number // Position in unified array (1-based)
}

