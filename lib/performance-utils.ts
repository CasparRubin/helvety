/**
 * Performance benchmarking and monitoring utilities.
 * Used to measure rendering performance and identify bottlenecks.
 */

import { logger } from "./logger"

/**
 * Performance measurement result.
 */
interface PerformanceMeasurement {
  /** Operation name */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Timestamp when measurement started */
  startTime: number
  /** Timestamp when measurement ended */
  endTime: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Performance metrics storage.
 */
class PerformanceMetrics {
  private measurements: PerformanceMeasurement[] = []
  private maxMeasurements = 100

  /**
   * Records a performance measurement.
   */
  record(measurement: PerformanceMeasurement): void {
    this.measurements.push(measurement)
    
    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }
  }

  /**
   * Gets all measurements for a specific operation.
   */
  getMeasurements(name: string): PerformanceMeasurement[] {
    return this.measurements.filter(m => m.name === name)
  }

  /**
   * Gets statistics for a specific operation.
   */
  getStats(name: string): {
    count: number
    average: number
    min: number
    max: number
    total: number
  } | null {
    const measurements = this.getMeasurements(name)
    if (measurements.length === 0) {
      return null
    }

    const durations = measurements.map(m => m.duration)
    const total = durations.reduce((sum, d) => sum + d, 0)
    const average = total / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return {
      count: measurements.length,
      average,
      min,
      max,
      total,
    }
  }

  /**
   * Clears all measurements.
   */
  clear(): void {
    this.measurements = []
  }

  /**
   * Gets all measurements.
   */
  getAll(): PerformanceMeasurement[] {
    return [...this.measurements]
  }
}

// Singleton metrics instance
const metrics = new PerformanceMetrics()

/**
 * Performance timer for measuring operation duration.
 */
class PerformanceTimer {
  private startTime: number
  private name: string
  private metadata?: Record<string, unknown>

  constructor(name: string, metadata?: Record<string, unknown>) {
    this.name = name
    this.startTime = performance.now()
    this.metadata = metadata
  }

  /**
   * Ends the timer and records the measurement.
   */
  end(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime

    metrics.record({
      name: this.name,
      duration,
      startTime: this.startTime,
      endTime,
      metadata: this.metadata,
    })

    return duration
  }

  /**
   * Ends the timer and logs the result.
   */
  endAndLog(): number {
    const duration = this.end()
    logger.log(`Performance: ${this.name} took ${duration.toFixed(2)}ms`)
    return duration
  }
}

/**
 * Starts a performance timer.
 * 
 * @param name - Operation name
 * @param metadata - Additional metadata
 * @returns Timer instance
 */
export function startTimer(
  name: string,
  metadata?: Record<string, unknown>
): PerformanceTimer {
  return new PerformanceTimer(name, metadata)
}

/**
 * Measures the execution time of an async function.
 * 
 * @param name - Operation name
 * @param fn - Function to measure
 * @param metadata - Additional metadata
 * @returns Function result and duration
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ result: T; duration: number }> {
  const timer = startTimer(name, metadata)
  try {
    const result = await fn()
    const duration = timer.end()
    return { result, duration }
  } catch (error) {
    timer.end()
    throw error
  }
}

/**
 * Measures the execution time of a synchronous function.
 * 
 * @param name - Operation name
 * @param fn - Function to measure
 * @param metadata - Additional metadata
 * @returns Function result and duration
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): { result: T; duration: number } {
  const timer = startTimer(name, metadata)
  try {
    const result = fn()
    const duration = timer.end()
    return { result, duration }
  } catch (error) {
    timer.end()
    throw error
  }
}

/**
 * Gets performance statistics for an operation.
 * 
 * @param name - Operation name
 * @returns Statistics or null if no measurements
 */
export function getPerformanceStats(name: string) {
  return metrics.getStats(name)
}

/**
 * Gets all performance measurements.
 * 
 * @returns All measurements
 */
export function getAllMeasurements(): PerformanceMeasurement[] {
  return metrics.getAll()
}

/**
 * Clears all performance measurements.
 */
export function clearMeasurements(): void {
  metrics.clear()
}

/**
 * Logs performance statistics for an operation.
 * 
 * @param name - Operation name
 */
export function logPerformanceStats(name: string): void {
  const stats = metrics.getStats(name)
  if (!stats) {
    logger.log(`No performance data for: ${name}`)
    return
  }

  logger.log(
    `Performance stats for "${name}": ` +
    `count=${stats.count}, ` +
    `avg=${stats.average.toFixed(2)}ms, ` +
    `min=${stats.min.toFixed(2)}ms, ` +
    `max=${stats.max.toFixed(2)}ms, ` +
    `total=${stats.total.toFixed(2)}ms`
  )
}

/**
 * Measures frame rate over a period of time.
 * 
 * @param durationMs - Duration to measure in milliseconds
 * @returns Promise resolving to average FPS
 */
export function measureFrameRate(durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0
    const startTime = performance.now()

    const countFrame = () => {
      frames++
      const elapsed = performance.now() - startTime

      if (elapsed < durationMs) {
        requestAnimationFrame(countFrame)
      } else {
        const fps = (frames / elapsed) * 1000
        resolve(fps)
      }
    }

    requestAnimationFrame(countFrame)
  })
}

/**
 * Measures time to first render for a component.
 * Uses PerformanceObserver if available, falls back to manual timing.
 * 
 * @param componentName - Component name for logging
 * @returns Function to call when render completes
 */
export function measureTimeToFirstRender(componentName: string): () => void {
  const startTime = performance.now()
  const markName = `${componentName}-render-start`

  // Create performance mark
  if (typeof performance.mark === 'function') {
    performance.mark(markName)
  }

  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime

    // Create performance measure
    if (typeof performance.measure === 'function') {
      const measureName = `${componentName}-render-duration`
      try {
        performance.measure(measureName, markName)
        const measure = performance.getEntriesByName(measureName)[0]
        logger.log(`Time to first render for ${componentName}: ${measure.duration.toFixed(2)}ms`)
      } catch {
        logger.log(`Time to first render for ${componentName}: ${duration.toFixed(2)}ms`)
      }
    } else {
      logger.log(`Time to first render for ${componentName}: ${duration.toFixed(2)}ms`)
    }

    // Record in metrics
    metrics.record({
      name: `render-${componentName}`,
      duration,
      startTime,
      endTime,
    })
  }
}
