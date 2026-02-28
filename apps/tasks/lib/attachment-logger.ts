/**
 * Attachment Audit Logger
 *
 * Provides structured logging for file attachment operations (uploads, downloads, deletions).
 * These logs serve as an audit trail for legal compliance and law enforcement cooperation.
 *
 * Logs are persisted to the `attachment_audit_logs` database table (via admin client,
 * bypassing RLS). Retention duration is managed by database/operations policy.
 * Additionally, logs are output to stdout for real-time monitoring.
 *
 * In production, stdout logs are formatted as JSON for log aggregation services.
 * In development, stdout logs are formatted for human readability.
 *
 * IMPORTANT: Never log encrypted content, encryption keys, or decrypted metadata.
 * Only non-encrypted operational metadata (timestamps, file sizes, paths, IPs) is logged.
 *
 * RETENTION: File operation metadata uses a target retention window up to
 * 6 months under current operational policy, subject to legal hold, incident
 * handling, and platform constraints.
 */

import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";

import type { LogLevel } from "@helvety/shared/auth-logger";
import type { Json } from "@helvety/shared/types/database";

/**
 * Attachment operation event types
 */
export const ATTACHMENT_AUDIT_EVENT_TYPES = [
  "attachment_upload_success",
  "attachment_upload_failed",
  "attachment_download",
  "attachment_deleted",
  "attachment_delete_failed",
] as const;

/** Supported attachment audit event union type. */
export type AttachmentEvent = (typeof ATTACHMENT_AUDIT_EVENT_TYPES)[number];

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
  attachment_upload_success: "info",
  attachment_upload_failed: "warn",
  attachment_download: "info",
  attachment_deleted: "info",
  attachment_delete_failed: "warn",
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
      metadata: (options.metadata ?? null) as Json | null,
    });

    if (error) {
      logger.error(
        "[ATTACHMENT-AUDIT] Failed to persist audit log to database:",
        { message: error.message }
      );
    }
  } catch (err) {
    logger.error("[ATTACHMENT-AUDIT] Unexpected error persisting audit log:", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Log an attachment operation event
 *
 * Writes to both stdout (for real-time monitoring) and the
 * `attachment_audit_logs` database table (retention controlled by policy/configuration).
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

  // ── Stdout logging via shared logger ────────────────────────────────
  const maskedUserId =
    userId.length > 8 ? `${userId.slice(0, 4)}...${userId.slice(-4)}` : userId;

  const message = `[ATTACHMENT] ${event} (user: ${maskedUserId})`;
  const details: Record<string, unknown> = {
    source: "attachment-audit",
    event,
    userId: maskedUserId,
    ...(attachmentId && { attachmentId }),
    ...(itemId && { itemId }),
    ...(storagePath && { storagePath }),
    ...(fileSizeBytes !== undefined && { fileSizeBytes }),
    ...(ip && { ip }),
    ...(metadata && { ...metadata }),
  };

  if (logEntry.level === "error") {
    logger.error(message, details);
  } else if (logEntry.level === "warn") {
    logger.warn(message, details);
  } else {
    logger.info(message, details);
  }

  // ── Database persistence (retention controlled by policy/configuration) ──
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
