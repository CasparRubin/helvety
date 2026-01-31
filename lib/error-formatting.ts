/**
 * Error formatting utilities for consistent error messages across the application.
 * Provides standardized formatting for single and multiple errors.
 *
 * Error message format standards:
 * - Start with action/context (e.g., "Can't load", "Failed to process")
 * - Include file/resource name in quotes when available (e.g., "filename.pdf")
 * - Include IDs or numbers when relevant (e.g., "page 5", "fileId: abc123")
 * - End with period for single errors
 * - Use numbered list for multiple errors
 * - Be concise but informative
 */

/**
 * Standard error message templates for consistency.
 */
export const ERROR_TEMPLATES = {
  /** Template: "Can't [action] '[filename]': [reason]" */
  CANT_ACTION_FILE: (
    action: string,
    filename: string,
    reason: string
  ): string => {
    return `Can't ${action} '${filename}': ${reason}`;
  },
  /** Template: "[Action] failed: [reason]" */
  ACTION_FAILED: (action: string, reason: string): string => {
    return `${action} failed: ${reason}`;
  },
  /** Template: "[Resource] not found. [context]" */
  NOT_FOUND: (resource: string, context?: string): string => {
    return context
      ? `${resource} not found. ${context}`
      : `${resource} not found.`;
  },
  /** Template: "Invalid [resource]: [details]" */
  INVALID: (resource: string, details: string): string => {
    return `Invalid ${resource}: ${details}`;
  },
} as const;

/**
 * Formats a single error message according to standards.
 * Internal helper function - not exported.
 *
 * @param error - The error message
 * @returns Formatted error message (trimmed)
 */
function formatSingleError(error: string): string {
  return error.trim();
}

/**
 * Formats multiple error messages into a single formatted string.
 * Each error is numbered for clarity.
 * Internal helper function - not exported.
 *
 * Format: "Some files couldn't be added:\n1. Error 1\n2. Error 2..."
 *
 * @param errors - Array of error messages
 * @returns Formatted error message with numbered list, or single error if only one
 */
function formatMultipleErrors(errors: ReadonlyArray<string>): string {
  if (errors.length === 0) {
    return "";
  }

  if (errors.length === 1) {
    // Length check guarantees errors[0] exists
    return formatSingleError(errors[0]!);
  }

  const formattedErrors = errors
    .map((err, idx) => `${idx + 1}. ${formatSingleError(err)}`)
    .join("\n");
  return `Some files couldn't be added:\n${formattedErrors}`;
}

/**
 * Formats validation errors (single or multiple) into a user-friendly message.
 *
 * @param errors - Array of error messages (can be empty)
 * @returns Formatted error message, or empty string if no errors
 */
export function formatValidationErrors(errors: ReadonlyArray<string>): string {
  if (errors.length === 0) {
    return "";
  }

  return formatMultipleErrors(errors);
}
