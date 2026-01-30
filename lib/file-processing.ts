/**
 * File processing utilities for handling PDF and image file operations.
 * Extracted from hooks to improve code organization and reusability.
 */

// External libraries
import type { PDFDocument } from "pdf-lib"

// Internal utilities
import { safeRevokeObjectURL } from "./blob-url-utils"
import { CACHE_LIMITS, PROCESSING } from "./constants"
import { createPdfErrorInfo, PdfErrorType } from "./pdf-errors"
import { getPdfColor } from "./pdf-colors"
import { loadFileWithPreview } from "./pdf-utils"
import { determineFileType } from "./validation-utils"
import { logger } from "./logger"
import { ERROR_TEMPLATES } from "./error-formatting"
import { yieldToBrowser } from "./batch-processing"
import { getRecommendedCacheLimit, shouldYieldToBrowser } from "./memory-utils"

// Types
import type { PdfFile } from "./types"

/**
 * Evicts least recently used entry from cache using LRU (Least Recently Used) strategy.
 * 
 * Cache eviction strategy (LRU):
 * - Map maintains insertion order in modern JavaScript, so first entry is least recently used
 * - When cache limit is reached, removes the least recently accessed entry (first in Map)
 * - Provides better cache hit rates than FIFO by keeping frequently used items
 * - Access order is updated when items are retrieved (via getCachedPdf in hook)
 * 
 * How LRU works:
 * 1. New entries are added at the end (most recently used position)
 * 2. When an entry is accessed, it's moved to the end (most recently used)
 * 3. When cache is full, the first entry (least recently used) is evicted
 * 4. This ensures frequently accessed PDFs stay in cache longer
 * 
 * Performance:
 * - Eviction: O(1) - just delete first entry
 * - Access update: O(1) - delete and re-add to end
 * - Better cache hit rates than FIFO for workloads with access patterns
 * 
 * @param cache - The PDF cache map
 * @param maxSize - Maximum cache size
 * @returns The evicted key, or undefined if no eviction occurred
 */
function evictLRUEntry(cache: Map<string, PDFDocument>, maxSize: number): string | undefined {
  if (cache.size >= maxSize) {
    const firstKey = cache.keys().next().value
    if (firstKey) {
      cache.delete(firstKey)
      logger.log(`LRU cache limit reached (${maxSize}), evicted least recently used: ${firstKey}`)
      return firstKey
    }
  }
  return undefined
}

/**
 * Result type for file processing operations.
 */
type ProcessFileResult = 
  | { readonly pdfFile: PdfFile }
  | { readonly error: string }

/**
 * Generates a unique ID using timestamp and random string.
 * 
 * @returns A unique identifier string
 */
export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Processes a single file (PDF or image) and creates a PdfFile object.
 * Handles file loading, caching, and error handling.
 * 
 * Cache eviction strategy (LRU):
 * - Uses Least Recently Used (LRU) eviction when cache is full
 * - Evicts oldest accessed entry when cache limit is reached
 * - Provides better cache hit rates than FIFO by keeping frequently used items
 * - Access order is updated when items are retrieved from cache
 * - Uses mobile-specific cache limits when isMobile is true
 * 
 * Browser yielding:
 * - Yields to browser before processing large files
 * - Yields more frequently on mobile devices
 * - Adapts yielding based on memory pressure
 * 
 * @param file - The file to process
 * @param fileIndex - The index of the file (used for color assignment)
 * @param pdfCache - The PDF cache map to use for storing loaded PDFs
 * @param isMobile - Whether the device is mobile (default: false)
 * @returns Object containing the processed PdfFile or an error message
 * 
 * @example
 * ```typescript
 * import { logger } from "./logger"
 * const result = await processFile(file, 0, pdfCache, true)
 * if ('error' in result) {
 *   logger.error('Processing failed:', result.error)
 * } else {
 *   logger.log('File processed:', result.pdfFile.id)
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Process multiple files
 * for (let i = 0; i < files.length; i++) {
 *   const result = await processFile(files[i], i, pdfCache, isMobile)
 *   if ('pdfFile' in result) {
 *     pdfFiles.push(result.pdfFile)
 *   }
 * }
 * ```
 */
export async function processFile(
  file: File,
  fileIndex: number,
  pdfCache: Map<string, PDFDocument>,
  isMobile: boolean = false
): Promise<ProcessFileResult> {
  // Validate inputs
  if (!file || !(file instanceof File)) {
    return { error: 'Invalid file provided. Expected a File object.' }
  }

  if (!Number.isInteger(fileIndex) || fileIndex < 0) {
    return { error: `Invalid file index: ${fileIndex}. Must be a non-negative integer.` }
  }

  if (!pdfCache || !(pdfCache instanceof Map)) {
    return { error: 'Invalid PDF cache provided. Expected a Map instance.' }
  }

  const isPdf = determineFileType(file) === 'pdf'
  let url: string | null = null

  try {
    // Yield to browser before processing large files or if memory pressure is high
    const fileSize = file.size
    const isLargeFile = fileSize > PROCESSING.LARGE_FILE_THRESHOLD
    const shouldYield = isMobile || isLargeFile || shouldYieldToBrowser(fileSize)
    
    if (shouldYield) {
      const yieldInterval = isMobile 
        ? PROCESSING.MOBILE_YIELD_INTERVAL 
        : PROCESSING.YIELD_INTERVAL
      await yieldToBrowser(yieldInterval)
    }

    const { pdf, url: previewUrl, fileType, inherentRotations } = await loadFileWithPreview(file, isPdf)
    url = previewUrl

    if (!url) {
      return { error: ERROR_TEMPLATES.ACTION_FAILED('Create preview URL', `'${file.name}' could not create a preview URL`) }
    }

    const count = pdf.getPageCount()

    if (count === 0) {
      safeRevokeObjectURL(url)
      return { error: `'${file.name}' has no pages.` }
    }

    // Use mobile-specific cache limit
    const cacheLimit = getRecommendedCacheLimit(
      CACHE_LIMITS.MAX_CACHED_PDFS,
      CACHE_LIMITS.MOBILE_MAX_CACHED_PDFS,
      isMobile
    )

    const fileId = generateFileId()
    evictLRUEntry(pdfCache, cacheLimit)
    pdfCache.set(fileId, pdf)
    logger.log(`Cached PDF for ${fileType} file: "${file.name}" (ID: ${fileId}, cache size: ${pdfCache.size}/${cacheLimit})`)

    const color = getPdfColor(fileIndex)

    const pdfFile: PdfFile = {
      id: fileId,
      file,
      url: url,
      pageCount: count,
      color,
      type: fileType,
      // Only include inherentRotations if there are any non-zero rotations
      ...(Object.keys(inherentRotations).length > 0 && { inherentRotations }),
    }

    url = null

    return { pdfFile }
  } catch (err) {
    safeRevokeObjectURL(url)
    
    const errorInfo = createPdfErrorInfo(err, `Can't load '${file.name}':`)
    if (errorInfo.type === PdfErrorType.CORRUPTED || errorInfo.type === PdfErrorType.INVALID_FORMAT) {
      logger.error('File validation error:', errorInfo)
    }
    
    return { error: errorInfo.message }
  }
}
