/**
 * Authentication Event Logger
 *
 * Provides structured logging for authentication and security events.
 * Routes all output through the shared logger so production gets
 * structured JSON and dev gets human-readable console output.
 *
 * IMPORTANT: Never log sensitive data like passwords, tokens, or full credentials.
 */

import { logger } from "./logger";

/**
 * Authentication event types
 */
export type AuthEvent =
  | "login_started"
  | "login_success"
  | "login_failed"
  | "logout"
  | "session_refresh"
  | "session_expired"
  | "passkey_registration_started"
  | "passkey_registration_success"
  | "passkey_registration_failed"
  | "passkey_auth_started"
  | "passkey_auth_success"
  | "passkey_auth_failed"
  | "otp_sent"
  | "otp_failed"
  | "rate_limit_exceeded"
  | "csrf_validation_failed"
  | "redirect_blocked";

/**
 * Log severity levels
 */
export type LogLevel = "info" | "warn" | "error";

/**
 * Map events to their default severity levels
 */
const EVENT_LEVELS: Record<AuthEvent, LogLevel> = {
  login_started: "info",
  login_success: "info",
  login_failed: "warn",
  logout: "info",
  session_refresh: "info",
  session_expired: "info",
  passkey_registration_started: "info",
  passkey_registration_success: "info",
  passkey_registration_failed: "warn",
  passkey_auth_started: "info",
  passkey_auth_success: "info",
  passkey_auth_failed: "warn",
  otp_sent: "info",
  otp_failed: "warn",
  rate_limit_exceeded: "warn",
  csrf_validation_failed: "error",
  redirect_blocked: "error",
};

/**
 * Sanitize metadata to remove sensitive information
 */
function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "credential",
    "authorization",
    "cookie",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive)
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Get the user agent from the browser (client-side only)
 */
function getUserAgent(): string | undefined {
  if (typeof navigator !== "undefined") {
    return navigator.userAgent;
  }
  return undefined;
}

/**
 * Log an authentication event
 *
 * @param event - The type of auth event
 * @param options - Optional additional data
 * @param options.userId - User ID if available (will be partially masked)
 * @param options.metadata - Additional context (sensitive data will be redacted)
 * @param options.ip - Client IP address
 * @param options.level - Override the default log level for this event
 *
 * @example
 * logAuthEvent("login_success", { userId: "user_123" });
 *
 * @example
 * logAuthEvent("login_failed", {
 *   metadata: { reason: "invalid_email" },
 *   ip: "192.168.1.1"
 * });
 */
export function logAuthEvent(
  event: AuthEvent,
  options: {
    userId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    level?: LogLevel;
  } = {}
): void {
  const { userId, metadata, ip, level } = options;

  const resolvedLevel = level ?? EVENT_LEVELS[event];

  const maskedUserId =
    userId && userId.length > 8
      ? `${userId.slice(0, 4)}...${userId.slice(-4)}`
      : userId;

  const sanitizedMeta =
    metadata && Object.keys(metadata).length > 0
      ? sanitizeMetadata(metadata)
      : undefined;

  const userAgent = getUserAgent();

  const details: Record<string, unknown> = {
    source: "auth",
    event,
    ...(maskedUserId && { userId: maskedUserId }),
    ...(sanitizedMeta && { ...sanitizedMeta }),
    ...(userAgent && { userAgent }),
    ...(ip && { ip }),
  };

  const message = `[AUTH] ${event}`;

  if (resolvedLevel === "error") {
    logger.error(message, details);
  } else if (resolvedLevel === "warn") {
    logger.warn(message, details);
  } else {
    logger.info(message, details);
  }
}
