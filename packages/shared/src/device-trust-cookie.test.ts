import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";
import {
  clearedDeviceTrustCookieOptions,
  decodeDeviceTrustCookieValue,
  DEVICE_TRUST_COOKIE_NAME,
  deviceTrustCookieOptions,
  encodeDeviceTrustCookieValue,
  getValidDeviceTrustFromCookieStore,
} from "./device-trust-cookie";

const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");
const TRUSTED_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("device-trust-cookie (shared)", () => {
  beforeEach(() => {
    process.env.DEVICE_TRUST_COOKIE_SECRET = DEVICE_TRUST_SECRET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses weekly maxAge in cookie options", () => {
    expect(deviceTrustCookieOptions().maxAge).toBe(AUTH_MAX_LIFETIME_SECONDS);
    expect(clearedDeviceTrustCookieOptions().maxAge).toBe(0);
  });

  it("encodes and validates a trust payload", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const value = encodeDeviceTrustCookieValue(TRUSTED_USER_ID);
    expect(decodeDeviceTrustCookieValue(value)?.userId).toBe(TRUSTED_USER_ID);
    const payload = getValidDeviceTrustFromCookieStore({
      get: (name) =>
        name === DEVICE_TRUST_COOKIE_NAME ? { name, value } : undefined,
    });
    expect(payload?.userId).toBe(TRUSTED_USER_ID);
  });

  it("rejects expired trust cookies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const value = encodeDeviceTrustCookieValue(TRUSTED_USER_ID);
    vi.advanceTimersByTime((AUTH_MAX_LIFETIME_SECONDS + 61) * 1000);
    const payload = getValidDeviceTrustFromCookieStore({
      get: (name) =>
        name === DEVICE_TRUST_COOKIE_NAME ? { name, value } : undefined,
    });
    expect(payload).toBeNull();
    expect(decodeDeviceTrustCookieValue(value)).toBeNull();
  });

  describe("decodeDeviceTrustCookieValue", () => {
    it("returns null when the signing secret is missing", () => {
      const value = encodeDeviceTrustCookieValue(TRUSTED_USER_ID);
      delete process.env.DEVICE_TRUST_COOKIE_SECRET;
      expect(decodeDeviceTrustCookieValue(value)).toBeNull();
    });

    it("returns null for malformed cookie values", () => {
      expect(decodeDeviceTrustCookieValue("not-a-valid-cookie")).toBeNull();
      expect(decodeDeviceTrustCookieValue("only-one-part")).toBeNull();
    });

    it("returns null when the HMAC signature was tampered with", () => {
      const value = encodeDeviceTrustCookieValue(TRUSTED_USER_ID);
      const [, signature] = value.split(".");
      const tamperedSignature =
        signature?.slice(0, -1) + (signature?.endsWith("a") ? "b" : "a");
      const tampered = `${value.split(".")[0]}.${tamperedSignature}`;
      expect(decodeDeviceTrustCookieValue(tampered)).toBeNull();
    });
  });

  describe("getValidDeviceTrustFromCookieStore", () => {
    it("returns null when the cookie is absent", () => {
      expect(
        getValidDeviceTrustFromCookieStore({
          get: () => undefined,
        })
      ).toBeNull();
    });

    it("returns null when the signing secret is missing", () => {
      const value = encodeDeviceTrustCookieValue(TRUSTED_USER_ID);
      delete process.env.DEVICE_TRUST_COOKIE_SECRET;
      expect(
        getValidDeviceTrustFromCookieStore({
          get: (name) =>
            name === DEVICE_TRUST_COOKIE_NAME ? { name, value } : undefined,
        })
      ).toBeNull();
    });
  });
});
