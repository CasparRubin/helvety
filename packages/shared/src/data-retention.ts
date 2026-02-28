/**
 * Swiss legal retention/deletion defaults used across Helvety services.
 *
 * These constants provide a canonical reference for implementation and
 * legal copy alignment. Values represent standard retention periods and may be
 * extended when a documented legal hold, dispute, or binding order applies.
 */

export const DATA_RETENTION = {
  /** Account deletion requests should complete without undue delay (target: <=30 days). */
  ACCOUNT_DELETION_TARGET_DAYS: 30,

  /** Security/abuse metadata for encrypted attachments (upload/download/delete). */
  ATTACHMENT_AUDIT_LOG_RETENTION_DAYS: 183, // ~6 months

  /** General technical security logs retention target. */
  TECHNICAL_LOG_RETENTION_DAYS: 183, // ~6 months

  /** Standard anti-abuse lockout state retention upper bound. */
  RATE_LIMIT_LOCKOUT_RETENTION_HOURS: 24,

  /** Contract and accounting evidence retention under Swiss obligations. */
  CONTRACT_EVIDENCE_RETENTION_YEARS: 10,
  TRANSACTION_EVIDENCE_RETENTION_YEARS: 10,
} as const;

/** Type alias for the shared retention policy constants. */
export type DataRetentionPolicy = typeof DATA_RETENTION;
