/**
 * Utility functions for efficient page and file lookups.
 * These functions help reduce code duplication and improve performance by converting
 * O(n) Array.find() operations to O(1) Map lookups.
 */

import type { PdfFile, UnifiedPage } from "./types"

/**
 * Creates a map of unified page numbers to UnifiedPage objects for O(1) lookups.
 * Converts O(n) Array.find() operations to O(1) Map lookups for better performance.
 * 
 * @param unifiedPages - Array of unified pages to convert to a map
 * @returns Map from unified page number to UnifiedPage object
 * 
 * @example
 * ```typescript
 * import { logger } from "./logger"
 * const pageMap = createPageMap(unifiedPages)
 * const page = pageMap.get(5) // O(1) lookup instead of O(n) Array.find()
 * if (page) {
 *   logger.log(`Page 5 is from file ${page.fileId}`)
 * }
 * ```
 */
export function createPageMap(unifiedPages: ReadonlyArray<UnifiedPage>): Map<number, UnifiedPage> {
  if (!Array.isArray(unifiedPages)) {
    throw new Error('Invalid unifiedPages parameter. Expected an array.')
  }

  const map = new Map<number, UnifiedPage>()
  unifiedPages.forEach(page => {
    if (!page || typeof page.unifiedPageNumber !== 'number') {
      throw new Error('Invalid page object in unifiedPages array. Missing unifiedPageNumber.')
    }
    map.set(page.unifiedPageNumber, page)
  })
  return map
}

/**
 * Creates a map of file IDs to PdfFile objects for O(1) lookups.
 * Converts O(n) Array.find() operations to O(1) Map lookups for better performance.
 * 
 * @param pdfFiles - Array of PDF files to convert to a map
 * @returns Map from file ID to PdfFile object
 * 
 * @example
 * ```typescript
 * import { logger } from "./logger"
 * const fileMap = createFileMap(pdfFiles)
 * const file = fileMap.get('file-123') // O(1) lookup
 * if (file) {
 *   logger.log(`File: ${file.file.name}, Pages: ${file.pageCount}`)
 * }
 * ```
 */
export function createFileMap(pdfFiles: ReadonlyArray<PdfFile>): Map<string, PdfFile> {
  if (!Array.isArray(pdfFiles)) {
    throw new Error('Invalid pdfFiles parameter. Expected an array.')
  }

  const map = new Map<string, PdfFile>()
  pdfFiles.forEach(file => {
    if (!file || typeof file.id !== 'string' || file.id.trim().length === 0) {
      throw new Error('Invalid file object in pdfFiles array. Missing or invalid id.')
    }
    map.set(file.id, file)
  })
  return map
}

/**
 * Creates a map of file IDs to blob URLs for O(1) lookups.
 * Converts O(n) Array.find() operations to O(1) Map lookups for better performance.
 * 
 * @param pdfFiles - Array of PDF files to extract URLs from
 * @returns Map from file ID to blob URL string
 * 
 * @example
 * ```typescript
 * const urlMap = createFileUrlMap(pdfFiles)
 * const url = urlMap.get('file-123') // O(1) lookup
 * if (url) {
 *   // Use URL for preview
 *   imageElement.src = url
 * }
 * ```
 */
export function createFileUrlMap(pdfFiles: ReadonlyArray<PdfFile>): Map<string, string> {
  if (!Array.isArray(pdfFiles)) {
    throw new Error('Invalid pdfFiles parameter. Expected an array.')
  }

  const map = new Map<string, string>()
  pdfFiles.forEach(file => {
    if (!file || typeof file.id !== 'string' || file.id.trim().length === 0) {
      throw new Error('Invalid file object in pdfFiles array. Missing or invalid id.')
    }
    if (typeof file.url !== 'string') {
      throw new Error(`Invalid file object in pdfFiles array. Missing or invalid url for file ${file.id}.`)
    }
    map.set(file.id, file.url)
  })
  return map
}

