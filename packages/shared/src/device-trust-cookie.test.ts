import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";
import {
  clearedDeviceTrustCookieOptions,
  deviceTrustCookieOptions,
  encodeDeviceTrustCookieValue,
  getValidDeviceTrustFromCookieStore,
} from "./device-trust-cookie";

const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");

describe("device-trust-cookie (shared)", () => {
  beforeEach(() => {
    process.env.DEVICE_TRUST_COOKIE_SECRET = DEVICE_TRUST_SECRET;
  });

  it("uses weekly maxAge in cookie options", () => {
    expect(deviceTrustCookieOptions().maxAge).toBe(AUTH_MAX_LIFETIME_SECONDS);
    expect(clearedDeviceTrustCookieOptions().maxAge).toBe(0);
  });

  it("encodes and validates a trust payload", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const value = encodeDeviceTrustCookieValue(userId);
    const payload = getValidDeviceTrustFromCookieStore({
      get: (name) =>
        name === "helvety_device_trust" ? { name, value } : undefined,
    });
    expect(payload?.userId).toBe(userId);
    vi.useRealTimers();
  });

  it("rejects expired trust cookies", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const value = encodeDeviceTrustCookieValue(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    vi.advanceTimersByTime((AUTH_MAX_LIFETIME_SECONDS + 61) * 1000);
    const payload = getValidDeviceTrustFromCookieStore({
      get: (name) =>
        name === "helvety_device_trust" ? { name, value } : undefined,
    });
    expect(payload).toBeNull();
    vi.useRealTimers();
  });
});
