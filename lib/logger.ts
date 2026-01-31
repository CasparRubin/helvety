/**
 * Logger utility
 * Provides environment-aware logging
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Log info messages (development only)
   * Uses console.warn since console.log is disabled by ESLint
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console -- Logger implementation
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
