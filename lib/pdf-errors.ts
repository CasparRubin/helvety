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
 * Sanitizes error messages to prevent XSS and remove sensitive information.
 * Removes HTML tags, script content, and limits message length.
 *
 * @param message - The error message to sanitize
 * @returns A sanitized error message safe for display
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
 * Sanitizes error messages to prevent XSS and ensure safe display.
 *
 * @param error - The error object (can be Error, string, or unknown)
 * @param context - Context string for the error (e.g., "Can't load 'filename.pdf':" or "Can't extract page:")
 * @returns A formatted and sanitized error message suitable for display to users
 */
export function formatPdfError(error: unknown, context: string): string {
  const rawErrorMessage =
    error instanceof Error ? error.message : String(error);
  const sanitizedErrorMessage = sanitizeErrorMessage(rawErrorMessage);
  const errorType = detectErrorType(sanitizedErrorMessage);

  const sanitizedContext = sanitizeErrorMessage(context);
  let userMessage = sanitizedContext;

  switch (errorType) {
    case PdfErrorType.PASSWORD_PROTECTED:
      userMessage +=
        " password-protected. Please remove the password and try again.";
      break;
    case PdfErrorType.CORRUPTED:
      userMessage +=
        " file may be corrupted. Please ensure the file is not damaged and try a different file.";
      break;
    case PdfErrorType.NETWORK:
      userMessage +=
        " network error occurred. Please check your connection and try again.";
      break;
    case PdfErrorType.TIMEOUT:
      userMessage +=
        " request timed out. Please try again with a smaller file or check your connection.";
      break;
    case PdfErrorType.INVALID_FORMAT:
      userMessage +=
        " file format is not supported. Please ensure the file is a valid PDF or image.";
      break;
    default:
      userMessage +=
        " an error occurred. Please ensure the file is valid and not corrupted or password-protected, then try again.";
  }

  return userMessage;
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
