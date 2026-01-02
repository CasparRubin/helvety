/**
 * Logger utility for consistent logging behavior across the application.
 * Only logs in development mode to avoid console pollution in production.
 */

type LogLevel = 'log' | 'warn' | 'error'

interface Logger {
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

/**
 * Creates a logger instance that only logs in development mode.
 * In production, all logging methods are no-ops.
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
      // Always log errors, even in production, but only in development console
      // In production, you might want to send to an error tracking service
      if (isDevelopment) {
        console.error(...args)
      }
      // TODO: In production, consider sending to error tracking service (e.g., Sentry)
    },
  }
}

// Export singleton logger instance
export const logger = createLogger()

