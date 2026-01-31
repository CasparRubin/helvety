/**
 * Centralized logging utility
 *
 * LOGGING STRATEGY:
 * - Development: All log levels (log, warn, info, debug, error) are output to console
 * - Production: Only error logs are output (with sanitization), other levels are suppressed
 *
 * RATIONALE:
 * - Errors are critical and need to be logged in production for monitoring/debugging
 * - Other log levels (log, warn, info, debug) are primarily for development debugging
 * - Production error logs are sanitized to prevent exposure of sensitive data
 * - This reduces production log noise while maintaining error visibility
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Type guard to check if a value is a record-like object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Sensitive keys that should be redacted from logs
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "token",
  "key",
  "api_key",
  "apikey",
  "auth",
  "authorization",
  "credential",
  "private",
]);

/**
 * Check if a key is sensitive and should be redacted
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return (
    SENSITIVE_KEYS.has(lowerKey) ||
    Array.from(SENSITIVE_KEYS).some((sensitive) => lowerKey.includes(sensitive))
  );
}

/**
 * Recursively sanitizes an object by removing sensitive keys
 * Handles nested objects and arrays
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  depth: number = 0
): Record<string, unknown> {
  // Prevent infinite recursion (max depth of 10)
  if (depth > 10) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Skip sensitive keys
      if (isSensitiveKey(key)) {
        continue;
      }

      const value = obj[key];

      // Skip functions - they cannot be serialized and may cause errors
      if (typeof value === "function") {
        continue;
      }

      // Recursively sanitize nested objects
      if (isRecord(value)) {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
      // Recursively sanitize arrays containing objects
      else if (Array.isArray(value)) {
        sanitized[key] = value
          .filter((item) => typeof item !== "function") // Remove functions from arrays
          .map((item) => {
            if (isRecord(item)) {
              return sanitizeObject(item, depth + 1);
            }
            return item;
          });
      }
      // Keep primitive values and other types as-is
      else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console -- Intentional: logger utility for development debugging
      console.log(...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, sanitize errors before logging
      const sanitizedArgs = args.map((arg) => {
        if (isRecord(arg)) {
          return sanitizeObject(arg);
        }
        if (Array.isArray(arg)) {
          return arg.map((item) => {
            if (isRecord(item)) {
              return sanitizeObject(item);
            }
            return item;
          });
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console -- Intentional: logger utility for development debugging
      console.info(...args);
    }
  },

  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console -- Intentional: logger utility for development debugging
      console.debug(...args);
    }
  },
};
