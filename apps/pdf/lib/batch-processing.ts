/**
 * Batch processing utilities for PDF operations.
 * Provides browser yielding and adaptive batch sizing for responsive UI.
 */

// Internal utilities
import { PROCESSING } from "./constants";
import { shouldYieldToBrowser, isMemoryPressureHigh } from "./memory-utils";
import { validateNonNegativeInteger } from "./validation-utils";

/**
 * Calculates optimal batch size based on total number of items.
 * Uses adaptive sizing: smaller batches for large documents to keep UI responsive,
 * larger batches for small documents to improve throughput.
 *
 * @param totalItems - Total number of items to process
 * @returns Optimal batch size (3-10 depending on total items)
 */
export function calculateBatchSize(totalItems: number): number {
  validateNonNegativeInteger(totalItems, "totalItems");

  if (totalItems <= 10) return 10;
  if (totalItems <= 50) return 8;
  if (totalItems <= 100) return 5;
  return 3;
}

/**
 * Yields control to the browser to prevent UI blocking.
 * Uses requestIdleCallback if available for optimal performance,
 * otherwise falls back to setTimeout(0) for immediate next tick.
 *
 * @param timeout - Maximum time to wait in milliseconds (default: 100)
 * @returns Promise that resolves when the browser is ready to continue processing
 */
export function yieldToBrowser(timeout: number = 100): Promise<void> {
  if (!Number.isFinite(timeout) || timeout < 0) {
    throw new Error(
      `Invalid timeout: ${timeout}. Must be a non-negative number.`
    );
  }

  return new Promise<void>((resolve: () => void) => {
    if (
      "requestIdleCallback" in window &&
      typeof window.requestIdleCallback === "function"
    ) {
      window.requestIdleCallback(() => resolve(), { timeout });
    } else {
      setTimeout(() => resolve(), 0);
    }
  });
}

/**
 * Yields to browser if memory pressure is high or if explicitly requested.
 * Uses memory monitoring to determine if yielding is needed.
 *
 * @param fileSizeBytes - Optional file size in bytes (for adaptive yielding)
 * @param isMobile - Whether device is mobile (default: false)
 * @param forceYield - Force yielding even if memory seems OK (default: false)
 * @returns Promise that resolves when yielding is complete (or skipped)
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
      : PROCESSING.YIELD_INTERVAL;
    await yieldToBrowser(yieldInterval);
    return;
  }

  // Check if yielding is recommended based on file size
  if (shouldYieldToBrowser(fileSizeBytes)) {
    const yieldInterval = isMobile
      ? PROCESSING.MOBILE_YIELD_INTERVAL
      : PROCESSING.YIELD_INTERVAL;
    await yieldToBrowser(yieldInterval);
    return;
  }

  // Check memory pressure
  const memoryPressure = isMemoryPressureHigh(85);
  if (memoryPressure === true) {
    // Use longer yield when memory pressure is high
    await yieldToBrowser(
      isMobile
        ? PROCESSING.MOBILE_YIELD_INTERVAL * 2
        : PROCESSING.YIELD_INTERVAL * 2
    );
    return;
  }

  // No yielding needed
}
