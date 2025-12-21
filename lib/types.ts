export interface PdfFile {
  id: string
  file: File
  url: string
  pageCount: number
  color: string
}

export interface UnifiedPage {
  id: string // Unique ID for this page in unified array
  fileId: string // Which file this page belongs to
  originalPageNumber: number // Original page number in the file (1-based)
  unifiedPageNumber: number // Position in unified array (1-based)
}

