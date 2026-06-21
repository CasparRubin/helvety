import { z } from "zod";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";

/** HTTP header carrying the HMAC-signed weekly email re-proof (extension Bearer routes). */
export const EXTENSION_WEEKLY_PROOF_HEADER = "X-Helvety-Weekly-Proof";

/** chrome.storage.local key for the server-minted weekly proof token. */
export const EXTENSION_WEEKLY_PROOF_STORAGE_KEY =
  "helvety_extension_weekly_proof";

const WEEKLY_PROOF_VERSION = 1;

/** Payload embedded in the signed weekly proof (same shape as device trust). */
const WeeklyProofPayloadSchema = z.object({
  v: z.literal(WEEKLY_PROOF_VERSION),
  userId: z.string().uuid(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
});

/** Parsed weekly proof payload (same fields as device trust cookie). */
export type WeeklyProofPayload = z.infer<typeof WeeklyProofPayloadSchema>;

/** Base64url decodes a string into UTF-8 text (browser + Node). */
function base64UrlDecodeToUtf8(input: string): string | null {
  try {
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Parses the payload segment of a weekly proof token without verifying HMAC.
 * Extension client uses this after storing a server-minted token; full signature
 * verification runs on helvety-auth Bearer routes (server holds the secret).
 */
function parseWeeklyProofPayloadUnsafe(
  token: string
): WeeklyProofPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const payloadPart = parts[0];
  if (!payloadPart) {
    return null;
  }
  const payloadJson = base64UrlDecodeToUtf8(payloadPart);
  if (!payloadJson) {
    return null;
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  const parsed = WeeklyProofPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

/** True when payload is unexpired and matches the signed-in user. */
function isWeeklyProofPayloadValidForUser(
  payload: WeeklyProofPayload,
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (payload.userId !== userId) {
    return false;
  }
  if (payload.exp <= nowSeconds) {
    return false;
  }
  if (payload.iat > nowSeconds + 60) {
    return false;
  }
  if (payload.exp > nowSeconds + AUTH_MAX_LIFETIME_SECONDS + 60) {
    return false;
  }
  return true;
}

/** Client-side structural check on a stored weekly proof token. */
export function isWeeklyProofTokenPlausibleForUser(
  token: string,
  userId: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  const payload = parseWeeklyProofPayloadUnsafe(token);
  if (!payload) {
    return false;
  }
  return isWeeklyProofPayloadValidForUser(payload, userId, nowSeconds);
}
