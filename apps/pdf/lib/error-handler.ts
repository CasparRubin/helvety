/**
 * Centralized error handling utilities for consistent error management across the application.
 * Provides standardized error handling patterns and error transformation.
 */

// Internal utilities
import { logger } from "@helvety/shared/logger";

import { createPdfErrorInfo, type PdfErrorInfo } from "./pdf-errors";

/**
 * Error handler callback type for setting errors in components.
 */
export type ErrorSetter = (error: string | null) => void;

/**
 * Handles an error by creating structured error info and calling the error setter.
 * This is the standard way to handle errors throughout the application.
 *
 * @param error - The error to handle (can be Error, string, or unknown)
 * @param context - Context string for the error (e.g., "Can't load 'filename.pdf':")
 * @param onError - Callback function to set the error message
 * @param logError - Whether to log the error (default: true)
 * @returns The created error info, or null if error was null/undefined
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (err) {
 *   handleError(err, "Operation failed:", setError)
 * }
 * ```
 */
export function handleError(
  error: unknown,
  context: string,
  onError: ErrorSetter,
  logError: boolean = true
): PdfErrorInfo | null {
  if (error === null || error === undefined) {
    onError(null);
    return null;
  }

  const errorInfo = createPdfErrorInfo(error, context);

  if (logError) {
    logger.error("Error handled:", errorInfo);
  }

  onError(errorInfo.message);
  return errorInfo;
}

/**
 * Type guard to check if an error is not null or undefined.
 * Provides a more specific type than the generic NonNullable check.
 *
 * @param error - The error to check (can be Error, string, or unknown)
 * @returns True if error is not null or undefined, narrowing the type to Error | string | object
 *
 * @example
 * ```typescript
 * if (isErrorDefined(error)) {
 *   // error is now typed as Error | string | object (not null/undefined)
 *   const message = error instanceof Error ? error.message : String(error)
 * }
 * ```
 */
export function isErrorDefined(
  error: unknown
): error is Error | string | object {
  return error !== null && error !== undefined;
}
