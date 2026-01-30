/**
 * Logger utility for consistent logging behavior across the application.
 * Only logs in development mode to avoid console pollution in production.
 */

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
      if (isDevelopment) {
        console.error(...args)
      }
    },
  }
}

// Export singleton logger instance
export const logger = createLogger()

