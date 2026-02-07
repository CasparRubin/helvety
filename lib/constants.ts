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
 * Attachment / file upload constants
 */
/** Maximum file size for attachments (25 MB) */
export const ATTACHMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;

/** Supabase Storage bucket name for encrypted attachment blobs */
export const ATTACHMENT_BUCKET = "encrypted-attachments";
