// Internal utilities
import { ERROR_LIMITS } from "./constants";

/**
 * Error types for better error categorization
 */
export enum PdfErrorType {
  PASSWORD_PROTECTED = "PASSWORD_PROTECTED",
  CORRUPTED = "CORRUPTED",
  NETWORK = "NETWORK",
  TIMEOUT = "TIMEOUT",
  INVALID_FORMAT = "INVALID_FORMAT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Structured error information
 */
export interface PdfErrorInfo {
  type: PdfErrorType;
  message: string;
  originalError?: unknown;
  retryable: boolean;
}

/**
 * Normalizes error text for display by stripping HTML-like tags and risky
 * substrings, then truncating overly long messages.
 *
 * This is a defensive cleanup step for UI rendering; it is not a complete XSS
 * sanitizer or secret-redaction guarantee.
 *
 * @param message - The error message to normalize
 * @returns A normalized error message for display
 */
function sanitizeErrorMessage(message: string): string {
  let sanitized = message
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();

  if (sanitized.length > ERROR_LIMITS.MAX_MESSAGE_LENGTH) {
    sanitized = `${sanitized.substring(0, ERROR_LIMITS.MAX_MESSAGE_LENGTH - ERROR_LIMITS.TRUNCATE_SUFFIX_LENGTH)}...`;
  }

  return sanitized;
}

/** Strip trailing punctuation/spaces so a full sentence can follow with a period. */
function trimContextForSentence(context: string): string {
  return context.replace(/[:;,\s]+$/g, "").trim();
}

/**
 * Determines the error type from an error message.
 *
 * @param errorMessage - The error message to analyze
 * @returns The detected error type
 */
function detectErrorType(errorMessage: string): PdfErrorType {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes("password") || lowerMessage.includes("encrypted")) {
    return PdfErrorType.PASSWORD_PROTECTED;
  }
  if (
    lowerMessage.includes("corrupt") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("malformed")
  ) {
    return PdfErrorType.CORRUPTED;
  }
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("failed to fetch")
  ) {
    return PdfErrorType.NETWORK;
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return PdfErrorType.TIMEOUT;
  }
  if (lowerMessage.includes("format") || lowerMessage.includes("unsupported")) {
    return PdfErrorType.INVALID_FORMAT;
  }

  return PdfErrorType.UNKNOWN;
}

/**
 * Formats file processing errors (PDFs and images) into user-friendly messages.
 *
 * Normalizes raw error text before rendering in user-visible messages.
 *
 * @param error - The error object (can be Error, string, or unknown)
 * @param context - Context string for the error (e.g., "Can't load 'filename.pdf':" or "Can't extract page:")
 * @returns A formatted and sanitized error message suitable for display to users
 */
function formatPdfError(error: unknown, context: string): string {
  const rawErrorMessage =
    error instanceof Error ? error.message : String(error);
  const sanitizedErrorMessage = sanitizeErrorMessage(rawErrorMessage);
  const errorType = detectErrorType(sanitizedErrorMessage);

  const sanitizedContext = sanitizeErrorMessage(context);
  const base = trimContextForSentence(sanitizedContext);
  const lead = base.length > 0 ? `${base}. ` : "";

  switch (errorType) {
    case PdfErrorType.PASSWORD_PROTECTED:
      return `${lead}This file is password-protected. Remove the password and try again.`;
    case PdfErrorType.CORRUPTED:
      return `${lead}The file may be corrupted. Try a different file or check that it is not damaged.`;
    case PdfErrorType.NETWORK:
      return `${lead}A network error occurred. Check your connection and try again.`;
    case PdfErrorType.TIMEOUT:
      return `${lead}The request timed out. Try a smaller file or check your connection.`;
    case PdfErrorType.INVALID_FORMAT:
      return `${lead}This file format is not supported. Use a valid PDF or image.`;
    default:
      return `${lead}Something went wrong while processing this file. Please try again.`;
  }
}

/**
 * Creates structured error information from an error.
 *
 * @param error - The error object
 * @param context - Context string for the error
 * @returns Structured error information
 */
export function createPdfErrorInfo(
  error: unknown,
  context: string
): PdfErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = detectErrorType(errorMessage);

  const retryable =
    errorType === PdfErrorType.NETWORK ||
    errorType === PdfErrorType.TIMEOUT ||
    errorType === PdfErrorType.UNKNOWN;

  return {
    type: errorType,
    message: formatPdfError(error, context),
    originalError: error,
    retryable,
  };
}
