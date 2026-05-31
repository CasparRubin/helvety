import "server-only";

import crypto from "node:crypto";

import { z } from "zod";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";
import { COOKIE_DOMAIN } from "./config";
import { logger } from "./logger";

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const DEVICE_TRUST_COOKIE_NAME = "helvety_device_trust";
const DEVICE_TRUST_VERSION = 1;

const DeviceTrustPayloadSchema = z.object({
  v: z.literal(DEVICE_TRUST_VERSION),
  userId: z.string().uuid(),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().nonnegative(),
});

/** Verified device-trust cookie payload. */
export type DeviceTrustPayload = z.infer<typeof DeviceTrustPayloadSchema>;

/** Return validated cookie-signing secret for device trust. */
function getDeviceTrustSecret(): string {
  const secret = process.env.DEVICE_TRUST_COOKIE_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error(
      "[shared] Missing DEVICE_TRUST_COOKIE_SECRET (required for device trust cookie signing)"
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "[shared] DEVICE_TRUST_COOKIE_SECRET is too short (min 32 chars recommended)"
    );
  }
  return secret;
}

/** Base64url encodes a buffer/string without padding. */
function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** Base64url decodes into a Node buffer. */
function base64UrlDecodeToBuffer(input: string): Buffer | null {
  try {
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

/** Returns the HMAC-SHA256 signature for a payload JSON string. */
function signPayload(payloadJson: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(payloadJson).digest();
  return base64UrlEncode(mac);
}

/** Timing-safe equality check for signatures. */
function safeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

/** Encodes a payload and signature into a cookie-safe string. */
function encodeCookieValue(
  payload: DeviceTrustPayload,
  secret: string
): string {
  const payloadJson = JSON.stringify(payload);
  const payloadPart = base64UrlEncode(payloadJson);
  const sigPart = signPayload(payloadJson, secret);
  return `${payloadPart}.${sigPart}`;
}

/** Decodes and validates the cookie value, returning a verified payload if valid. */
function decodeCookieValue(
  value: string,
  secret: string
): DeviceTrustPayload | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, sigPart] = parts;
  if (!payloadPart || !sigPart) return null;
  const payloadBuf = base64UrlDecodeToBuffer(payloadPart);
  if (!payloadBuf) return null;

  const payloadJson = payloadBuf.toString("utf8");
  const expectedSig = signPayload(payloadJson, secret);
  if (!safeEqual(expectedSig, sigPart)) return null;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  const parsed = DeviceTrustPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (parsed.data.exp <= nowSeconds) return null;
  if (parsed.data.iat > nowSeconds + 60) return null;
  if (parsed.data.exp > nowSeconds + AUTH_MAX_LIFETIME_SECONDS + 60) {
    return null;
  }

  return parsed.data;
}

/** Cookie options for the device trust marker (shared across apps in prod). */
export function deviceTrustCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  maxAge: number;
  path: "/";
  domain?: string;
} {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: AUTH_MAX_LIFETIME_SECONDS,
    path: "/",
    ...(isProduction && COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

/** Set device trust for the given user (fresh weekly TTL). */
export function encodeDeviceTrustCookieValue(userId: string): string {
  const secret = getDeviceTrustSecret();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: DeviceTrustPayload = {
    v: DEVICE_TRUST_VERSION,
    userId,
    iat: nowSeconds,
    exp: nowSeconds + AUTH_MAX_LIFETIME_SECONDS,
  };
  return encodeCookieValue(payload, secret);
}

/** Clear device trust cookie options for this browser/device. */
export function clearedDeviceTrustCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  maxAge: 0;
  path: "/";
  domain?: string;
} {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    ...(isProduction && COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

/** Returns the verified device-trust payload from a cookie store, or null. */
export function getValidDeviceTrustFromCookieStore(
  cookieStore: Pick<ReadonlyRequestCookies, "get">
): DeviceTrustPayload | null {
  try {
    const secret = getDeviceTrustSecret();
    const cookie = cookieStore.get(DEVICE_TRUST_COOKIE_NAME);
    if (!cookie?.value) return null;
    return decodeCookieValue(cookie.value, secret);
  } catch (error) {
    logger.warn(
      "Device trust cookie validation failed; treating as untrusted.",
      {
        message: error instanceof Error ? error.message : String(error),
      }
    );
    return null;
  }
}
