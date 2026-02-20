/**
 * Attachment Audit Logger
 *
 * Provides structured logging for file attachment operations (uploads, downloads, deletions).
 * These logs serve as an audit trail for legal compliance and law enforcement cooperation.
 *
 * Logs are persisted to the `attachment_audit_logs` database table (via admin client,
 * bypassing RLS) for reliable 6-month retention as promised in the Privacy Policy.
 * Additionally, logs are output to stdout for real-time monitoring.
 *
 * In production, stdout logs are formatted as JSON for log aggregation services.
 * In development, stdout logs are formatted for human readability.
 *
 * IMPORTANT: Never log encrypted content, encryption keys, or decrypted metadata.
 * Only non-encrypted operational metadata (timestamps, file sizes, paths, IPs) is logged.
 *
 * RETENTION: File operation metadata is retained for up to 6 months
 * in accordance with the Privacy Policy.
 */

import { createAdminClient } from "@helvety/shared/supabase/admin";

import type { LogLevel } from "@helvety/shared/auth-logger";

/**
 * Attachment operation event types
 */
export type AttachmentEvent =
  | "attachment_upload_started"
  | "attachment_upload_success"
  | "attachment_upload_failed"
  | "attachment_download"
  | "attachment_deleted"
  | "attachment_delete_failed"
  | "attachment_rate_limited";

/**
 * Attachment audit log entry structure
 */
export interface AttachmentLogEntry {
  timestamp: string;
  level: LogLevel;
  event: AttachmentEvent;
  userId: string;
  attachmentId?: string;
  itemId?: string;
  storagePath?: string;
  fileSizeBytes?: number;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Map events to their default severity levels
 */
const EVENT_LEVELS: Record<AttachmentEvent, LogLevel> = {
  attachment_upload_started: "info",
  attachment_upload_success: "info",
  attachment_upload_failed: "warn",
  attachment_download: "info",
  attachment_deleted: "info",
  attachment_delete_failed: "warn",
  attachment_rate_limited: "warn",
};

/**
 * Persist an audit log entry to the database.
 * Uses the admin client (service role) to bypass RLS since users
 * should never have read/write access to audit logs.
 *
 * This is fire-and-forget: failures are logged to stderr but never
 * block the calling operation.
 */
async function persistToDatabase(
  event: AttachmentEvent,
  options: {
    userId: string;
    attachmentId?: string;
    itemId?: string;
    storagePath?: string;
    fileSizeBytes?: number;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("attachment_audit_logs").insert({
      event,
      user_id: options.userId,
      attachment_id: options.attachmentId ?? null,
      item_id: options.itemId ?? null,
      storage_path: options.storagePath ?? null,
      file_size_bytes: options.fileSizeBytes ?? null,
      ip_address: options.ip ?? null,
      user_agent: options.userAgent ?? null,
      metadata: options.metadata ?? null,
    });

    if (error) {
      // Log to stderr but don't throw -- audit persistence should never
      // block the user's operation
      console.error(
        "[ATTACHMENT-AUDIT] Failed to persist audit log to database:",
        error.message
      );
    }
  } catch (err) {
    console.error(
      "[ATTACHMENT-AUDIT] Unexpected error persisting audit log:",
      err
    );
  }
}

/**
 * Log an attachment operation event
 *
 * Writes to both stdout (for real-time monitoring) and the
 * `attachment_audit_logs` database table (for 6-month retention).
 *
 * @param event - The type of attachment event
 * @param options - Event details
 * @param options.userId - User ID (will be partially masked in dev logs)
 * @param options.attachmentId - Attachment record ID
 * @param options.itemId - Parent item ID
 * @param options.storagePath - Storage path in Supabase Storage
 * @param options.fileSizeBytes - Size of the encrypted file blob in bytes
 * @param options.ip - Client IP address
 * @param options.userAgent - Client user agent string
 * @param options.metadata - Additional non-sensitive context
 * @param options.level - Override the default log level for this event
 *
 * @example
 * logAttachmentEvent("attachment_upload_success", {
 *   userId: "550e8400-e29b-41d4-a716-446655440000",
 *   attachmentId: "123e4567-e89b-12d3-a456-426614174000",
 *   storagePath: "550e8400.../123e4567...",
 *   fileSizeBytes: 1048576,
 *   ip: "192.168.1.1",
 * });
 */
export function logAttachmentEvent(
  event: AttachmentEvent,
  options: {
    userId: string;
    attachmentId?: string;
    itemId?: string;
    storagePath?: string;
    fileSizeBytes?: number;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    level?: LogLevel;
  }
): void {
  const {
    userId,
    attachmentId,
    itemId,
    storagePath,
    fileSizeBytes,
    ip,
    userAgent,
    metadata,
    level,
  } = options;

  const logEntry: AttachmentLogEntry = {
    timestamp: new Date().toISOString(),
    level: level ?? EVENT_LEVELS[event],
    event,
    userId,
  };

  if (attachmentId) logEntry.attachmentId = attachmentId;
  if (itemId) logEntry.itemId = itemId;
  if (storagePath) logEntry.storagePath = storagePath;
  if (fileSizeBytes !== undefined) logEntry.fileSizeBytes = fileSizeBytes;
  if (ip) logEntry.ip = ip;
  if (userAgent) logEntry.userAgent = userAgent;
  if (metadata && Object.keys(metadata).length > 0)
    logEntry.metadata = metadata;

  // ── Stdout logging (real-time monitoring) ──────────────────────────
  if (process.env.NODE_ENV === "production") {
    // JSON format for log aggregation services
    const logFn =
      logEntry.level === "error"
        ? console.error
        : logEntry.level === "warn"
          ? console.warn
          : // eslint-disable-next-line no-console -- Audit logger intentionally uses console.log
            console.log;
    logFn(JSON.stringify({ ...logEntry, source: "attachment-audit" }));
  } else {
    // Human-readable format for development
    const prefix = `[ATTACHMENT:${logEntry.level.toUpperCase()}]`;
    const maskedUserId =
      userId.length > 8
        ? `${userId.slice(0, 4)}...${userId.slice(-4)}`
        : userId;
    const message = `${prefix} ${event} (user: ${maskedUserId})`;
    const details = {
      ...(attachmentId && { attachmentId }),
      ...(itemId && { itemId }),
      ...(storagePath && { storagePath }),
      ...(fileSizeBytes !== undefined && { fileSizeBytes }),
      ...(ip && { ip }),
      ...(metadata && { ...metadata }),
    };

    if (Object.keys(details).length > 0) {
      // eslint-disable-next-line no-console -- Audit logger intentionally uses console.log
      console.log(message, details);
    } else {
      // eslint-disable-next-line no-console -- Audit logger intentionally uses console.log
      console.log(message);
    }
  }

  // ── Database persistence (6-month retention) ───────────────────────
  // Fire-and-forget: don't await, don't block the caller
  void persistToDatabase(event, {
    userId,
    attachmentId,
    itemId,
    storagePath,
    fileSizeBytes,
    ip,
    userAgent,
    metadata,
  });
}
