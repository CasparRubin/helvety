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

/**
 * Attachment / file upload constants
 */
/** Maximum file size for attachments (25 MB) */
export const ATTACHMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;

/** Supabase Storage bucket name for encrypted attachment blobs */
export const ATTACHMENT_BUCKET = "encrypted-attachments";
