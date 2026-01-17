/**
 * Logger utility for consistent logging behavior across the application.
 * Only logs in development mode to avoid console pollution in production.
 * 
 * For production error tracking integration:
 * 1. Install an error tracking service (e.g., @sentry/nextjs)
 * 2. Initialize it in your app initialization code
 * 3. Update the error method below to send errors to the service
 * 4. Ensure error tracking only runs in production (not in development)
 */

interface Logger {
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

/**
 * Optional error tracking function for production environments.
 * Set this to integrate with error tracking services like Sentry.
 * 
 * @param error - The error to track
 * @param context - Additional context about where the error occurred
 */
let errorTrackingFn: ((error: unknown, context?: string) => void) | null = null

/**
 * Sets the error tracking function for production error reporting.
 * Call this during app initialization to enable error tracking.
 * 
 * @param fn - Function to handle error tracking
 * 
 * @example
 * ```typescript
 * import * as Sentry from "@sentry/nextjs"
 * 
 * if (process.env.NODE_ENV === 'production') {
 *   setErrorTracking((error, context) => {
 *     Sentry.captureException(error, { extra: { context } })
 *   })
 * }
 * ```
 */
export function setErrorTracking(fn: (error: unknown, context?: string) => void): void {
  errorTrackingFn = fn
}

/**
 * Creates a logger instance that only logs in development mode.
 * In production, all logging methods are no-ops, except errors which
 * can optionally be sent to an error tracking service.
 * 
 * @returns A logger object with log, warn, and error methods
 */
function createLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    log: (...args: unknown[]): void => {
      if (isDevelopment) {
        console.log(...args)
      }
    },
    warn: (...args: unknown[]): void => {
      if (isDevelopment) {
        console.warn(...args)
      }
    },
    error: (...args: unknown[]): void => {
      if (isDevelopment) {
        console.error(...args)
      } else if (errorTrackingFn && args.length > 0) {
        // In production, send first argument (usually the error) to tracking service
        const error = args[0]
        const context = args.length > 1 ? String(args[1]) : undefined
        errorTrackingFn(error, context)
      }
    },
  }
}

// Export singleton logger instance
export const logger = createLogger()

