/**
 * Custom hook for monitoring and managing ImageBitmap memory usage.
 * Automatically cleans up cache when memory pressure is detected.
 */

import * as React from "react"
import { getImageBitmapCache } from "@/lib/imagebitmap-cache"
import { isMemoryPressureHigh, getMemoryUsagePercent } from "@/lib/memory-utils"
import { isImageBitmapCacheMemoryHigh } from "@/lib/memory-utils"
import { logger } from "@/lib/logger"

/**
 * Configuration for memory monitoring.
 */
interface MemoryMonitoringConfig {
  /** Check interval in milliseconds (default: 5000) */
  checkInterval?: number
  /** Memory pressure threshold percentage (default: 80%) */
  memoryThreshold?: number
  /** Cache memory threshold percentage (default: 85%) */
  cacheThreshold?: number
}

/**
 * Custom hook for monitoring ImageBitmap memory usage.
 * Automatically cleans up cache when memory pressure is detected.
 * 
 * @param config - Memory monitoring configuration
 */
export function useImageBitmapMemory(config: MemoryMonitoringConfig = {}): void {
  const {
    checkInterval = 5000,
    memoryThreshold = 80,
    cacheThreshold = 85,
  } = config

  const cacheRef = React.useRef(getImageBitmapCache())

  React.useEffect(() => {
    const cache = cacheRef.current
    let intervalId: ReturnType<typeof setInterval> | null = null

    const checkMemory = () => {
      try {
        // Check system memory pressure
        const systemMemoryHigh = isMemoryPressureHigh(memoryThreshold)
        if (systemMemoryHigh === true) {
          logger.warn('System memory pressure detected, clearing ImageBitmap cache')
          cache.clear()
          return
        }

        // Check cache memory usage
        const stats = cache.getStats()
        const cacheMemoryHigh = isImageBitmapCacheMemoryHigh(stats, cacheThreshold)
        
        if (cacheMemoryHigh) {
          logger.warn(
            `ImageBitmap cache memory high (${Math.round(stats.memoryUsagePercent)}%), clearing cache`
          )
          cache.clear()
          return
        }

        // Log memory stats periodically (every 5 checks = 25 seconds)
        if (Math.random() < 0.2) {
          const systemMemory = getMemoryUsagePercent()
          logger.log(
            `Memory stats - System: ${systemMemory !== null ? Math.round(systemMemory) + '%' : 'N/A'}, ` +
            `Cache: ${Math.round(stats.memoryUsagePercent)}% (${Math.round(stats.memoryBytes / 1024 / 1024)}MB/${Math.round(stats.maxMemoryBytes / 1024 / 1024)}MB)`
          )
        }
      } catch (error) {
        logger.error('Error checking ImageBitmap memory:', error)
      }
    }

    // Start monitoring
    intervalId = setInterval(checkMemory, checkInterval)

    // Initial check
    checkMemory()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [checkInterval, memoryThreshold, cacheThreshold])
}
