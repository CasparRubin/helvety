/**
 * Batch processing utilities for PDF operations.
 * Extracted from hooks to improve code organization and reusability.
 * 
 * Batch processing approach:
 * - Processes items in configurable batch sizes (3-10 items per batch)
 * - Adaptive batch sizing: smaller batches for large documents, larger for small documents
 * - Each batch has timeout protection (scales with batch size)
 * - Yields to browser between batches to prevent UI blocking
 * - Supports partial failure mode (continueOnError option)
 * - Provides progress callbacks for UI updates
 * 
 * Batch size calculation strategy:
 * - ≤10 items: 10 per batch (fast processing, minimal UI impact)
 * - ≤50 items: 8 per batch (balanced performance)
 * - ≤100 items: 5 per batch (prioritize UI responsiveness)
 * - >100 items: 3 per batch (maximize UI responsiveness for large documents)
 * 
 * Timeout strategy:
 * - Each batch has a timeout that scales with batch size
 * - Default: OPERATION_TIMEOUT * batchSize (capped at 3x OPERATION_TIMEOUT)
 * - Individual items within batch can also have timeouts
 * - Batch timeout prevents entire operation from hanging
 * 
 * Error handling:
 * - Uses Promise.allSettled to continue processing even if some items fail
 * - Can be configured to stop on first batch failure (continueOnError: false)
 * - Collects all errors and returns them in results array
 * - Provides detailed error information including item index
 * 
 * Performance characteristics:
 * - Batch size calculation: O(1)
 * - Processing: O(n) where n is number of items
 * - Memory: O(batchSize) - only one batch in memory at a time
 * - Time complexity: O(n) with browser yields between batches
 * - Browser yields prevent UI blocking and maintain responsiveness
 */

// Internal utilities
import { TIMEOUTS, PROCESSING } from "./constants"
import { withTimeout } from "./timeout-utils"
import { shouldYieldToBrowser, isMemoryPressureHigh } from "./memory-utils"

/**
 * Result of processing a single item in a batch.
 */
export type BatchItemResult<T> = 
  | { readonly success: true; readonly value: T; readonly itemIndex: number }
  | { readonly success: false; readonly error: string; readonly itemIndex: number }

/**
 * Options for batch processing.
 */
export interface BatchProcessOptions {
  /** Maximum time to wait for entire batch (ms). Defaults to OPERATION_TIMEOUT * batchSize (capped at 3x) */
  readonly batchTimeout?: number
  /** Time to yield to browser between batches (ms). Default: 100 */
  readonly yieldDelay?: number
  /** Whether to continue processing if some items fail. Default: false */
  readonly continueOnError?: boolean
  /** Callback for progress updates */
  readonly onProgress?: (processed: number, total: number, batchNumber: number, totalBatches: number) => void
}

/**
 * Calculates optimal batch size based on total number of items.
 * Uses adaptive sizing: smaller batches for large documents to keep UI responsive,
 * larger batches for small documents to improve throughput.
 * 
 * Batch size strategy:
 * - ≤10 items: 10 per batch (fast processing, minimal UI impact)
 * - ≤50 items: 8 per batch (balanced performance)
 * - ≤100 items: 5 per batch (prioritize UI responsiveness)
 * - >100 items: 3 per batch (maximize UI responsiveness for large documents)
 * 
 * @param totalItems - Total number of items to process
 * @returns Optimal batch size (3-10 depending on total items)
 * 
 * @example
 * ```typescript
 * const batchSize = calculateBatchSize(100) // Returns 5
 * const batchSize = calculateBatchSize(5)  // Returns 10
 * ```
 */
export function calculateBatchSize(totalItems: number): number {
  // Validate input
  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error(`Invalid totalItems: ${totalItems}. Must be a non-negative integer.`)
  }

  if (totalItems <= 10) {
    return 10
  }
  if (totalItems <= 50) {
    return 8
  }
  if (totalItems <= 100) {
    return 5
  }
  return 3
}

/**
 * Yields control to the browser to prevent UI blocking.
 * Uses requestIdleCallback if available for optimal performance,
 * otherwise falls back to setTimeout(0) for immediate next tick.
 * 
 * @param timeout - Maximum time to wait in milliseconds (default: 100)
 * @returns Promise that resolves when the browser is ready to continue processing
 * 
 * @example
 * ```typescript
 * // Yield between batches
 * await yieldToBrowser(100)
 * ```
 */
export function yieldToBrowser(timeout: number = 100): Promise<void> {
  // Validate input
  if (!Number.isFinite(timeout) || timeout < 0) {
    throw new Error(`Invalid timeout: ${timeout}. Must be a non-negative finite number.`)
  }

  return new Promise<void>((resolve: () => void) => {
    if ('requestIdleCallback' in window && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout })
    } else {
      setTimeout(() => resolve(), 0)
    }
  })
}

/**
 * Yields to browser if memory pressure is high or if explicitly requested.
 * Uses memory monitoring to determine if yielding is needed.
 * 
 * @param fileSizeBytes - Optional file size in bytes (for adaptive yielding)
 * @param isMobile - Whether device is mobile (default: false)
 * @param forceYield - Force yielding even if memory seems OK (default: false)
 * @returns Promise that resolves when yielding is complete (or skipped)
 * 
 * @example
 * ```typescript
 * // Yield if memory pressure is high
 * await yieldToBrowserIfNeeded(file.size, isMobile)
 * ```
 */
export async function yieldToBrowserIfNeeded(
  fileSizeBytes?: number,
  isMobile: boolean = false,
  forceYield: boolean = false
): Promise<void> {
  // Always yield if forced
  if (forceYield) {
    const yieldInterval = isMobile 
      ? PROCESSING.MOBILE_YIELD_INTERVAL 
      : PROCESSING.YIELD_INTERVAL
    await yieldToBrowser(yieldInterval)
    return
  }

  // Check if yielding is recommended
  if (shouldYieldToBrowser(fileSizeBytes)) {
    const yieldInterval = isMobile 
      ? PROCESSING.MOBILE_YIELD_INTERVAL 
      : PROCESSING.YIELD_INTERVAL
    await yieldToBrowser(yieldInterval)
    return
  }

  // Check memory pressure
  const memoryPressure = isMemoryPressureHigh(85)
  if (memoryPressure === true) {
    // Use longer yield when memory pressure is high
    await yieldToBrowser(isMobile ? PROCESSING.MOBILE_YIELD_INTERVAL * 2 : PROCESSING.YIELD_INTERVAL * 2)
    return
  }

  // No yielding needed
}

/**
 * Calculates adaptive yield interval based on file size and device type.
 * Larger files and mobile devices get more frequent yielding.
 * 
 * @param fileSizeBytes - Size of file being processed
 * @param isMobile - Whether device is mobile
 * @returns Recommended yield interval in milliseconds
 */
export function calculateYieldInterval(fileSizeBytes: number, isMobile: boolean): number {
  const baseInterval = isMobile 
    ? PROCESSING.MOBILE_YIELD_INTERVAL 
    : PROCESSING.YIELD_INTERVAL

  // More frequent yielding for very large files
  if (fileSizeBytes > PROCESSING.VERY_LARGE_FILE_THRESHOLD) {
    return Math.floor(baseInterval * 0.5) // Half the interval
  }
  
  if (fileSizeBytes > PROCESSING.LARGE_FILE_THRESHOLD) {
    return Math.floor(baseInterval * 0.75) // 75% of interval
  }

  return baseInterval
}

/**
 * Extracts error message from an unknown error value.
 * 
 * @param error - The error to extract message from
 * @returns A string error message
 */
function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Processes a single item in a batch and returns a result.
 * 
 * @param item - The item to process
 * @param globalIndex - The global index of the item
 * @param processor - Function to process the item
 * @returns A batch item result (success or error)
 * @template TItem - Type of item to process
 * @template TResult - Type of result from processing
 */
async function processBatchItem<TItem, TResult>(
  item: TItem,
  globalIndex: number,
  processor: (item: TItem, index: number) => Promise<TResult>
): Promise<BatchItemResult<TResult>> {
  try {
    const value = await processor(item, globalIndex)
    return { success: true as const, value, itemIndex: globalIndex }
  } catch (error) {
    return { success: false as const, error: extractErrorMessage(error), itemIndex: globalIndex }
  }
}

/**
 * Processes batch results from Promise.allSettled and adds them to results array.
 * 
 * @param batchResults - Results from Promise.allSettled
 * @param batchStartIndex - Starting index of the batch
 * @param batchLength - Length of the batch
 * @param results - Array to add results to
 * @template TResult - Type of result from processing
 */
function processBatchResults<TResult>(
  batchResults: ReadonlyArray<PromiseSettledResult<BatchItemResult<TResult>>>,
  batchStartIndex: number,
  batchLength: number,
  results: BatchItemResult<TResult>[]
): void {
  for (const result of batchResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      const errorMessage = extractErrorMessage(result.reason)
      // If the entire batch promise was rejected, mark all items in batch as failed
      for (let j = 0; j < batchLength; j++) {
        results.push({
          success: false,
          error: errorMessage,
          itemIndex: batchStartIndex + j,
        })
      }
    }
  }
}

/**
 * Checks if all items in a batch failed and throws if continueOnError is false.
 * 
 * @param results - All results processed so far
 * @param batchStartIndex - Starting index of the batch
 * @param batchLength - Length of the batch
 * @param batchNumber - Current batch number (for error message)
 * @param continueOnError - Whether to continue on error
 * @throws {Error} If all items failed and continueOnError is false
 * @template TResult - Type of result from processing
 */
function checkBatchFailure<TResult>(
  results: ReadonlyArray<BatchItemResult<TResult>>,
  batchStartIndex: number,
  batchLength: number,
  batchNumber: number,
  continueOnError: boolean
): void {
  const batchErrors = results.filter((r): r is Extract<BatchItemResult<TResult>, { success: false }> => 
    !r.success && r.itemIndex >= batchStartIndex && r.itemIndex < batchStartIndex + batchLength
  )
  
  if (batchErrors.length === batchLength && !continueOnError) {
    throw new Error(`All items in batch ${batchNumber} failed. First error: ${batchErrors[0]?.error ?? 'unknown'}`)
  }
}

/**
 * Handles batch processing errors by adding error results for failed items.
 * 
 * @param error - The error that occurred
 * @param results - Array to add error results to
 * @param batchStartIndex - Starting index of the batch
 * @param batchLength - Length of the batch
 * @template TResult - Type of result from processing
 */
function handleBatchError<TResult>(
  error: unknown,
  results: BatchItemResult<TResult>[],
  batchStartIndex: number,
  batchLength: number
): void {
  const errorMessage = extractErrorMessage(error)
  // Add error results for all items in the batch that haven't been processed yet
  for (let j = results.length; j < batchStartIndex + batchLength; j++) {
    results.push({
      success: false,
      error: errorMessage,
      itemIndex: j,
    })
  }
}

/**
 * Processes items in batches with timeout handling and error recovery.
 * 
 * Batch processing strategy:
 * - Processes items in configurable batch sizes
 * - Each batch has its own timeout (scales with batch size)
 * - Yields to browser between batches to prevent UI blocking
 * - Supports partial failure (continueOnError option)
 * - Provides progress callbacks
 * 
 * @param items - Array of items to process
 * @param processor - Function to process each item (returns Promise)
 * @param batchSize - Number of items per batch (default: calculated from total)
 * @param options - Processing options (timeouts, error handling, callbacks)
 * @returns Array of results for each item (success or error)
 * @template TItem - Type of items to process
 * @template TResult - Type of result from processing
 * 
 * @example
 * ```typescript
 * import { logger } from "./logger"
 * const results = await processInBatches(
 *   pages,
 *   async (page) => await processPage(page),
 *   5,
 *   { continueOnError: true, onProgress: (p, t) => logger.log(`${p}/${t}`) }
 * )
 * ```
 */
export async function processInBatches<TItem, TResult>(
  items: ReadonlyArray<TItem>,
  processor: (item: TItem, index: number) => Promise<TResult>,
  batchSize: number = calculateBatchSize(items.length),
  options: BatchProcessOptions = {}
): Promise<ReadonlyArray<BatchItemResult<TResult>>> {
  const {
    batchTimeout,
    yieldDelay = 100,
    continueOnError = false,
    onProgress,
  } = options

  const results: BatchItemResult<TResult>[] = []
  const totalBatches = Math.ceil(items.length / batchSize)

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const batchStartIndex = i

    const calculatedTimeout = batchTimeout ?? Math.min(
      TIMEOUTS.OPERATION_TIMEOUT * batch.length,
      TIMEOUTS.OPERATION_TIMEOUT * 3
    )

    try {
      const batchResults = await withTimeout(
        Promise.allSettled(
          batch.map((item, batchIdx) => 
            processBatchItem(item, batchStartIndex + batchIdx, processor)
          )
        ),
        calculatedTimeout,
        `Batch ${batchNumber}/${totalBatches} timed out after ${calculatedTimeout}ms.`
      )

      processBatchResults(batchResults, batchStartIndex, batch.length, results)
      checkBatchFailure(results, batchStartIndex, batch.length, batchNumber, continueOnError)

      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length, batchNumber, totalBatches)
      }

    } catch (err) {
      if (!continueOnError) {
        throw err
      }
      handleBatchError(err, results, batchStartIndex, batch.length)
    }

    if (i + batchSize < items.length) {
      await yieldToBrowser(yieldDelay)
    }
  }

  return results
}

