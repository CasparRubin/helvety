/**
 * Toast notification durations (in milliseconds)
 */
export const TOAST_DURATIONS = {
  /** Error messages (auto-dismiss) */
  ERROR: 8000,
} as const;

/**
 * Reusable user-facing error messages
 */
export const ERROR_MESSAGES = {
  /** Data export failure */
  EXPORT_FAILED: "Failed to export data. Please try again.",
} as const;
