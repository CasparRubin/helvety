import "server-only";

import { logger } from "@helvety/shared/logger";
import { EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR } from "@helvety/shared/user-facing-errors";

import { isAllowedChromeExtensionOrigin } from "@/lib/chrome-extension-origin";

export { EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR };

export const EXTENSION_INVALID_REQUEST_BODY_ERROR = "Invalid request body";

/** Extracts `origin` from a parsed JSON body when present. */
export function extractExtensionOriginFromBody(body: unknown): string | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "origin" in body &&
    typeof (body as { origin?: unknown }).origin === "string"
  ) {
    return (body as { origin: string }).origin;
  }
  return null;
}

/**
 *
 */
function logExtensionOriginRejected(origin: string): void {
  let extensionId = origin;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === "chrome-extension:" && parsed.host) {
      extensionId = parsed.host;
    }
  } catch {
    // keep raw origin for logs
  }
  logger.warn("Extension origin not allowlisted", {
    extensionId,
    envVar: "HELVETY_CHROME_EXTENSION_ORIGINS",
  });
}

/**
 * Maps a Zod parse failure on extension routes to a user-facing error.
 * Only returns the allowlist message when origin is a disallowed chrome-extension URL.
 */
export function extensionOriginParseBodyError(origin: string | null): string {
  if (!origin?.startsWith("chrome-extension://")) {
    return EXTENSION_INVALID_REQUEST_BODY_ERROR;
  }
  if (!isAllowedChromeExtensionOrigin(origin)) {
    logExtensionOriginRejected(origin);
    return EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR;
  }
  return EXTENSION_INVALID_REQUEST_BODY_ERROR;
}

/** Rejects a disallowed extension origin for OTP/passkey handlers. */
export function extensionOriginRejectedResponse(origin: string): {
  success: false;
  error: string;
} | null {
  const error = extensionOriginRejectedError(origin);
  if (!error) {
    return null;
  }
  return { success: false, error };
}

/** User-facing allowlist error for `chrome-extension://` origins, or null if allowed. */
export function extensionOriginRejectedError(origin: string): string | null {
  if (!origin.startsWith("chrome-extension://")) {
    return null;
  }
  if (isAllowedChromeExtensionOrigin(origin)) {
    return null;
  }
  logExtensionOriginRejected(origin);
  return EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR;
}
