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
 * Cross-app entity limits (business quotas).
 * Keep these values in sync with database-enforced limits and app-side checks.
 */
export const ENTITY_LIMITS = {
  /** Deprecated legacy quota (units model, no longer active) */
  MAX_UNITS_PER_USER: 10,
  /** Deprecated legacy quota (spaces model, no longer active) */
  MAX_SPACES_PER_UNIT: 15,
  /** Maximum tasks allowed per account */
  MAX_TASKS_PER_USER: 250,
  /** Deprecated alias kept for backward compatibility */
  MAX_ITEMS_PER_SPACE: 250,
  /** Maximum Contacts a single user can create */
  MAX_CONTACTS_PER_USER: 250,
  /** Maximum Notes a single user can create */
  MAX_NOTES_PER_USER: 250,
} as const;
