import { AUTH_MAX_LIFETIME_SECONDS } from "@helvety/shared/auth-session-policy";
import { decodeDeviceTrustCookieValue } from "@helvety/shared/device-trust-cookie";
import { logger } from "@helvety/shared/logger";
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

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import {
  clearDeviceTrustCookie,
  getValidDeviceTrustCookie,
  mintAndVerifyDeviceTrustCookie,
  setDeviceTrustCookie,
} from "./device-trust-cookie";

const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");
const TRUSTED_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

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
    await setDeviceTrustCookie(TRUSTED_USER_ID);
    const payload = await getValidDeviceTrustCookie();
    expect(payload?.userId).toBe(TRUSTED_USER_ID);
    expect(payload?.v).toBe(1);
  });

  it("mintAndVerify returns true when read-back matches the minted user", async () => {
    await expect(mintAndVerifyDeviceTrustCookie(TRUSTED_USER_ID)).resolves.toBe(
      true
    );
    const payload = await getValidDeviceTrustCookie();
    expect(payload?.userId).toBe(TRUSTED_USER_ID);
  });

  it("mintAndVerify returns true when encode/decode passes even if read-back is deferred", async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);
    await expect(mintAndVerifyDeviceTrustCookie(TRUSTED_USER_ID)).resolves.toBe(
      true
    );
    expect(mocks.cookieStore.set).toHaveBeenCalled();
  });

  it("still writes a verifiable cookie when read-back is deferred", async () => {
    mocks.cookieStore.get.mockReturnValue(undefined);
    await mintAndVerifyDeviceTrustCookie(TRUSTED_USER_ID);
    const setCall = mocks.cookieStore.set.mock.calls.find(
      ([name]) => name === "helvety_device_trust"
    );
    const encoded = setCall?.[1];
    expect(typeof encoded).toBe("string");
    expect(decodeDeviceTrustCookieValue(encoded as string)?.userId).toBe(
      TRUSTED_USER_ID
    );
  });

  it("mintAndVerify returns false when read-back userId differs from mint target", async () => {
    await setDeviceTrustCookie(OTHER_USER_ID);
    mocks.cookieStore.set.mockImplementation(() => undefined);
    await expect(mintAndVerifyDeviceTrustCookie(TRUSTED_USER_ID)).resolves.toBe(
      false
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Device trust read-back userId mismatch after mint.",
      {
        expectedUserId: TRUSTED_USER_ID,
        actualUserId: OTHER_USER_ID,
      }
    );
  });

  it("mintAndVerify returns false when minting throws", async () => {
    delete process.env.DEVICE_TRUST_COOKIE_SECRET;
    await expect(mintAndVerifyDeviceTrustCookie(TRUSTED_USER_ID)).resolves.toBe(
      false
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Device trust mint failed.",
      expect.objectContaining({
        message: expect.stringContaining("DEVICE_TRUST_COOKIE_SECRET"),
      })
    );
  });

  it("clears the trust cookie", async () => {
    await setDeviceTrustCookie(TRUSTED_USER_ID);
    await clearDeviceTrustCookie();
    const payload = await getValidDeviceTrustCookie();
    expect(payload).toBeNull();
  });

  it("sets maxAge and payload exp to 7 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const nowSeconds = Math.floor(Date.now() / 1000);

    await setDeviceTrustCookie(TRUSTED_USER_ID);

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      "helvety_device_trust",
      expect.any(String),
      expect.objectContaining({ maxAge: DEVICE_TRUST_TTL_SECONDS })
    );
    const payload = await getValidDeviceTrustCookie();
    expect(payload).toMatchObject({
      userId: TRUSTED_USER_ID,
      iat: nowSeconds,
      exp: nowSeconds + DEVICE_TRUST_TTL_SECONDS,
    });
    vi.useRealTimers();
  });

  it("rejects expired trust cookies", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await setDeviceTrustCookie(TRUSTED_USER_ID);
    vi.advanceTimersByTime((DEVICE_TRUST_TTL_SECONDS + 61) * 1000);
    expect(await getValidDeviceTrustCookie()).toBeNull();
    vi.useRealTimers();
  });
});
