import { AUTH_MAX_LIFETIME_SECONDS } from "@helvety/shared/auth-session-policy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const DEVICE_TRUST_TTL_SECONDS = AUTH_MAX_LIFETIME_SECONDS;

const mocks = vi.hoisted(() => {
  const store = new Map<string, string>();
  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = store.get(name);
      return value ? { name, value } : undefined;
    }),
    set: vi.fn(
      (name: string, value: string, _options?: Record<string, unknown>) => {
        store.set(name, value);
      }
    ),
  };
  return {
    cookieStore,
    store,
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock("@helvety/shared/config", () => ({
  COOKIE_DOMAIN: ".helvety.com",
}));

import {
  clearDeviceTrustCookie,
  getValidDeviceTrustCookie,
  mintAndVerifyDeviceTrustCookie,
  setDeviceTrustCookie,
} from "./device-trust-cookie";

const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");

describe("device-trust-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.clear();
    mocks.cookieStore.get.mockImplementation((name: string) => {
      const value = mocks.store.get(name);
      return value ? { name, value } : undefined;
    });
    mocks.cookieStore.set.mockImplementation(
      (name: string, value: string, _options?: Record<string, unknown>) => {
        mocks.store.set(name, value);
      }
    );
    process.env.DEVICE_TRUST_COOKIE_SECRET = DEVICE_TRUST_SECRET;
  });

  it("sets and validates a trust cookie", async () => {
    await setDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000");
    const payload = await getValidDeviceTrustCookie();
    expect(payload?.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(payload?.v).toBe(1);
  });

  it("mintAndVerify returns true when mint and read-back match", async () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    await expect(mintAndVerifyDeviceTrustCookie(userId)).resolves.toBe(true);
    const payload = await getValidDeviceTrustCookie();
    expect(payload?.userId).toBe(userId);
  });

  it("mintAndVerify returns false when cookie is not readable after set", async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);
    await expect(
      mintAndVerifyDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000")
    ).resolves.toBe(false);
  });

  it("mintAndVerify returns false when read-back userId differs", async () => {
    const expected = "550e8400-e29b-41d4-a716-446655440000";
    const other = "660e8400-e29b-41d4-a716-446655440001";
    await setDeviceTrustCookie(other);
    mocks.cookieStore.set.mockImplementation(() => undefined);
    await expect(mintAndVerifyDeviceTrustCookie(expected)).resolves.toBe(false);
  });

  it("clears the trust cookie", async () => {
    await setDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000");
    await clearDeviceTrustCookie();
    // getValidDeviceTrustCookie should treat cleared cookie as untrusted.
    const payload = await getValidDeviceTrustCookie();
    expect(payload).toBeNull();
  });

  it("sets maxAge and payload exp to 7 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const nowSeconds = Math.floor(Date.now() / 1000);

    await setDeviceTrustCookie(userId);

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      "helvety_device_trust",
      expect.any(String),
      expect.objectContaining({ maxAge: DEVICE_TRUST_TTL_SECONDS })
    );
    const payload = await getValidDeviceTrustCookie();
    expect(payload).toMatchObject({
      userId,
      iat: nowSeconds,
      exp: nowSeconds + DEVICE_TRUST_TTL_SECONDS,
    });
    vi.useRealTimers();
  });

  it("rejects expired trust cookies", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await setDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000");
    vi.advanceTimersByTime((DEVICE_TRUST_TTL_SECONDS + 61) * 1000);
    expect(await getValidDeviceTrustCookie()).toBeNull();
    vi.useRealTimers();
  });
});
