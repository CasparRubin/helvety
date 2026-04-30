/**
 * Toast notification durations (in milliseconds)
 */
export const TOAST_DURATIONS = {
  /** Success messages */
  SUCCESS: 5000,
  /** Informational messages */
  INFO: 4000,
  /** Error messages (auto-dismiss) */
  ERROR: 8000,
  /** Critical errors (manual dismiss) */
  ERROR_CRITICAL: Infinity,
} as const;

/**
 * Reusable user-facing error messages
 */
export const ERROR_MESSAGES = {
  /** Data export failure */
  EXPORT_FAILED: "Failed to export data. Please try again.",
} as const;

/**
 * Shared caps for server actions: batch reorder, chunked updates, and export row bounds.
 * Used by tasks, notes, and contacts so limits stay consistent.
 */
export const ACTION_LIMITS = {
  MAX_REORDER_ITEMS: 2000,
  REORDER_CHUNK_SIZE: 50,
  MAX_EXPORT_ROWS_PER_TABLE: 5000,
  MAX_DASHBOARD_ROWS: 2000,
} as const;
