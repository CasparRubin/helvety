/**
 * ImageBitmap caching utilities for rendered PDF pages.
 * Provides LRU cache for ImageBitmap objects with memory management.
 */

import { logger } from './logger'

/**
 * Cache entry containing ImageBitmap and metadata.
 */
interface CacheEntry {
  /** The cached ImageBitmap */
  readonly imageBitmap: ImageBitmap
  /** Timestamp when entry was created */
  readonly createdAt: number
  /** Timestamp when entry was last accessed */
  lastAccessed: number
  /** Estimated memory size in bytes (width * height * 4 for RGBA) */
  readonly estimatedSize: number
}

/**
 * LRU cache for ImageBitmap objects.
 * Automatically evicts least recently used entries when size limit is reached.
 */
class ImageBitmapCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private maxMemoryBytes: number
  private currentMemoryBytes = 0

  constructor(maxSize: number = 50, maxMemoryBytes: number = 200 * 1024 * 1024) {
    this.maxSize = maxSize
    this.maxMemoryBytes = maxMemoryBytes // Default 200MB
  }

  /**
   * Estimates memory size of an ImageBitmap.
   * 
   * @param imageBitmap - The ImageBitmap to estimate
   * @returns Estimated size in bytes
   */
  private estimateSize(imageBitmap: ImageBitmap): number {
    // RGBA = 4 bytes per pixel
    return imageBitmap.width * imageBitmap.height * 4
  }

  /**
   * Gets a cached ImageBitmap by key.
   * Updates last accessed time.
   * 
   * @param key - Cache key
   * @returns Cached ImageBitmap or undefined if not found
   */
  get(key: string): ImageBitmap | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      return undefined
    }

    // Update last accessed time
    entry.lastAccessed = Date.now()
    
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.imageBitmap
  }

  /**
   * Stores an ImageBitmap in the cache.
   * Evicts old entries if necessary.
   * 
   * @param key - Cache key
   * @param imageBitmap - ImageBitmap to cache
   */
  set(key: string, imageBitmap: ImageBitmap): void {
    const estimatedSize = this.estimateSize(imageBitmap)
    const now = Date.now()

    // Check if entry already exists
    const existing = this.cache.get(key)
    if (existing) {
      // Update existing entry
      this.currentMemoryBytes -= existing.estimatedSize
      this.cache.set(key, {
        imageBitmap,
        createdAt: existing.createdAt,
        lastAccessed: now,
        estimatedSize,
      })
      this.currentMemoryBytes += estimatedSize
      return
    }

    // Evict entries if needed (by count)
    while (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    // Evict entries if needed (by memory)
    while (
      this.currentMemoryBytes + estimatedSize > this.maxMemoryBytes &&
      this.cache.size > 0
    ) {
      this.evictLRU()
    }

    // Add new entry
    this.cache.set(key, {
      imageBitmap,
      createdAt: now,
      lastAccessed: now,
      estimatedSize,
    })
    this.currentMemoryBytes += estimatedSize

    logger.log(`Cached ImageBitmap: ${key} (${Math.round(estimatedSize / 1024)}KB, total: ${Math.round(this.currentMemoryBytes / 1024 / 1024)}MB)`)
  }

  /**
   * Evicts the least recently used entry.
   */
  private evictLRU(): void {
    if (this.cache.size === 0) {
      return
    }

    // Find LRU entry (first in Map is least recently used)
    const firstKey = this.cache.keys().next().value
    if (!firstKey) {
      return
    }

    const entry = this.cache.get(firstKey)
    if (entry) {
      // Clean up ImageBitmap
      entry.imageBitmap.close()
      this.currentMemoryBytes -= entry.estimatedSize
      this.cache.delete(firstKey)
      logger.log(`Evicted ImageBitmap from cache: ${firstKey}`)
    }
  }

  /**
   * Removes a specific entry from the cache.
   * 
   * @param key - Cache key to remove
   */
  delete(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.imageBitmap.close()
      this.currentMemoryBytes -= entry.estimatedSize
      this.cache.delete(key)
    }
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.imageBitmap.close()
    }
    this.cache.clear()
    this.currentMemoryBytes = 0
    logger.log('Cleared ImageBitmap cache')
  }

  /**
   * Gets cache statistics.
   * 
   * @returns Cache statistics object
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryBytes: this.currentMemoryBytes,
      maxMemoryBytes: this.maxMemoryBytes,
      memoryUsagePercent: (this.currentMemoryBytes / this.maxMemoryBytes) * 100,
    }
  }

  /**
   * Checks if cache has a specific key.
   * 
   * @param key - Cache key to check
   * @returns True if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }
}

// Singleton cache instance
let cacheInstance: ImageBitmapCache | null = null

/**
 * Gets the global ImageBitmap cache instance.
 * 
 * @param maxSize - Maximum number of entries (default: 50)
 * @param maxMemoryBytes - Maximum memory in bytes (default: 200MB)
 * @returns Cache instance
 */
export function getImageBitmapCache(
  maxSize: number = 50,
  maxMemoryBytes: number = 200 * 1024 * 1024
): ImageBitmapCache {
  if (!cacheInstance) {
    cacheInstance = new ImageBitmapCache(maxSize, maxMemoryBytes)
  }
  return cacheInstance
}

/**
 * Generates a cache key for a PDF page render.
 * 
 * @param fileUrl - PDF file URL
 * @param pageNumber - Page number
 * @param width - Render width
 * @param devicePixelRatio - Device pixel ratio
 * @param rotation - Rotation angle
 * @returns Cache key string
 */
export function generateCacheKey(
  fileUrl: string,
  pageNumber: number,
  width: number,
  devicePixelRatio: number,
  rotation: number
): string {
  // Create a stable key from render parameters
  return `${fileUrl}:${pageNumber}:${width}:${devicePixelRatio}:${rotation}`
}

/**
 * Cleans up ImageBitmap cache (useful for memory management).
 */
export function cleanupImageBitmapCache(): void {
  if (cacheInstance) {
    cacheInstance.clear()
  }
}
