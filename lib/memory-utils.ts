/**
 * Memory monitoring and pressure detection utilities.
 * Helps detect memory pressure and adapt processing accordingly.
 */

/**
 * Memory information from the Performance API (if available).
 */
interface MemoryInfo {
  /** Total JS heap size limit (bytes) */
  readonly jsHeapSizeLimit?: number
  /** Total allocated heap size (bytes) */
  readonly totalJSHeapSize?: number
  /** Used JS heap size (bytes) */
  readonly usedJSHeapSize?: number
}

/**
 * Extended Performance interface with memory information (Chrome/Edge specific).
 */
interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo
}

/**
 * Type guard to check if Performance object has memory property.
 * 
 * @param perf - Performance object to check
 * @returns True if performance object has memory property
 */
function hasMemoryProperty(perf: Performance): perf is PerformanceWithMemory {
  return 'memory' in perf && perf.memory !== undefined
}

/**
 * Gets memory information from the browser's Performance API.
 * Only available in Chrome/Edge. Returns null if not available.
 * 
 * Uses a type guard to safely access the non-standard `memory` property
 * that exists only in Chrome/Edge browsers. TypeScript's standard Performance
 * type doesn't include this property, so we use a type guard to narrow the type.
 * 
 * @returns Memory information object or null if not available
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  // Use type guard to safely access non-standard memory property
  if (hasMemoryProperty(window.performance)) {
    const memory = window.performance.memory
    if (memory) {
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      }
    }
  }

  return null
}

/**
 * Calculates memory usage percentage based on available memory info.
 * 
 * @returns Memory usage percentage (0-100) or null if not available
 */
export function getMemoryUsagePercent(): number | null {
  const memory = getMemoryInfo()
  if (!memory || !memory.jsHeapSizeLimit || !memory.usedJSHeapSize) {
    return null
  }

  return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
}

/**
 * Checks if memory pressure is high based on usage percentage.
 * 
 * @param threshold - Memory usage threshold to consider "high" (default: 80%)
 * @returns True if memory pressure is high, false otherwise (or null if memory info unavailable)
 */
export function isMemoryPressureHigh(threshold: number = 80): boolean | null {
  const usage = getMemoryUsagePercent()
  if (usage === null) {
    return null
  }

  return usage >= threshold
}

/**
 * Gets available memory estimate (if available).
 * 
 * @returns Available memory in bytes or null if not available
 */
export function getAvailableMemory(): number | null {
  const memory = getMemoryInfo()
  if (!memory || !memory.jsHeapSizeLimit || !memory.usedJSHeapSize) {
    return null
  }

  return memory.jsHeapSizeLimit - memory.usedJSHeapSize
}

/**
 * Checks if there's enough memory available for processing a file of given size.
 * Uses heuristics since exact memory requirements are hard to predict.
 * 
 * @param fileSizeBytes - Size of the file in bytes
 * @param safetyMultiplier - Multiplier for safety margin (default: 3x - PDFs need more memory than file size)
 * @returns True if likely enough memory, false if likely not enough, null if can't determine
 */
export function hasEnoughMemory(
  fileSizeBytes: number,
  safetyMultiplier: number = 3
): boolean | null {
  const available = getAvailableMemory()
  if (available === null) {
    return null // Can't determine, let it try
  }

  // PDF processing typically needs 2-4x the file size in memory
  const estimatedNeeded = fileSizeBytes * safetyMultiplier
  return available >= estimatedNeeded
}

/**
 * Gets recommended cache limit based on available memory.
 * 
 * @param defaultLimit - Default cache limit
 * @param mobileLimit - Mobile cache limit
 * @param isMobile - Whether device is mobile
 * @returns Recommended cache limit
 */
export function getRecommendedCacheLimit(
  defaultLimit: number,
  mobileLimit: number,
  isMobile: boolean
): number {
  // Start with device-specific default
  let limit = isMobile ? mobileLimit : defaultLimit

  // Adjust based on memory pressure if available
  const memory = getMemoryInfo()
  if (memory && memory.jsHeapSizeLimit) {
    const usage = getMemoryUsagePercent()
    if (usage !== null) {
      // Reduce cache limit if memory usage is high
      if (usage >= 80) {
        limit = Math.floor(limit * 0.5) // Reduce to 50%
      } else if (usage >= 60) {
        limit = Math.floor(limit * 0.75) // Reduce to 75%
      }
    }
  }

  return Math.max(1, limit) // Ensure at least 1
}

/**
 * Determines if yielding to browser is recommended based on memory pressure.
 * 
 * @param fileSizeBytes - Size of file being processed (optional)
 * @returns True if yielding is recommended
 */
export function shouldYieldToBrowser(fileSizeBytes?: number): boolean {
  // Always yield if memory pressure is high
  const memoryPressure = isMemoryPressureHigh(85)
  if (memoryPressure === true) {
    return true
  }

  // Yield for very large files even if memory seems OK
  if (fileSizeBytes && fileSizeBytes > 50 * 1024 * 1024) { // 50MB
    return true
  }

  return false
}

/**
 * Estimates memory usage of an ImageBitmap in bytes.
 * 
 * @param imageBitmap - The ImageBitmap to estimate
 * @returns Estimated memory size in bytes (width * height * 4 for RGBA)
 */
export function estimateImageBitmapSize(imageBitmap: ImageBitmap): number {
  return imageBitmap.width * imageBitmap.height * 4
}

/**
 * Gets total estimated memory usage from ImageBitmap cache.
 * 
 * @param cacheStats - Cache statistics from ImageBitmapCache.getStats()
 * @returns Total memory usage in bytes
 */
export function getImageBitmapCacheMemoryUsage(cacheStats: {
  memoryBytes: number
}): number {
  return cacheStats.memoryBytes
}

/**
 * Checks if ImageBitmap cache memory usage is high.
 * 
 * @param cacheStats - Cache statistics from ImageBitmapCache.getStats()
 * @param thresholdPercent - Threshold percentage (default: 80%)
 * @returns True if cache memory usage is high
 */
export function isImageBitmapCacheMemoryHigh(
  cacheStats: {
    memoryBytes: number
    maxMemoryBytes: number
  },
  thresholdPercent: number = 80
): boolean {
  const usagePercent = (cacheStats.memoryBytes / cacheStats.maxMemoryBytes) * 100
  return usagePercent >= thresholdPercent
}
