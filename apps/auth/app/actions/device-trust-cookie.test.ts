import { beforeEach, describe, expect, it, vi } from "vitest";

const DEVICE_TRUST_TTL_SECONDS = 30 * 24 * 60 * 60;

const mocks = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    cookieStore: {
      get: vi.fn((name: string) => {
        const value = store.get(name);
        return value ? { name, value } : undefined;
      }),
      set: vi.fn(
        (name: string, value: string, _options?: Record<string, unknown>) => {
          store.set(name, value);
        }
      ),
    },
    store,
    getValidatedAuthEnv: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
}));

vi.mock("@/lib/env", () => ({
  getValidatedAuthEnv: mocks.getValidatedAuthEnv,
}));

vi.mock("@helvety/shared/config", () => ({
  COOKIE_DOMAIN: ".helvety.com",
}));

import {
  clearDeviceTrustCookie,
  getValidDeviceTrustCookie,
  setDeviceTrustCookie,
} from "./device-trust-cookie";

describe("device-trust-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store.clear();
    mocks.getValidatedAuthEnv.mockReturnValue({
      SUPABASE_SECRET_KEY: "x".repeat(60),
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      HELVETY_COOKIE_SIGNING_SECRET: "cookie_signing_secret_".padEnd(40, "s"),
      DEVICE_TRUST_COOKIE_SECRET: "dev_secret_".padEnd(40, "s"),
    });
  });

  it("sets and validates a trust cookie", async () => {
    await setDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000");
    const payload = await getValidDeviceTrustCookie();
    expect(payload?.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(payload?.v).toBe(1);
  });

  it("clears the trust cookie", async () => {
    await setDeviceTrustCookie("550e8400-e29b-41d4-a716-446655440000");
    await clearDeviceTrustCookie();
    // getValidDeviceTrustCookie should treat cleared cookie as untrusted.
    const payload = await getValidDeviceTrustCookie();
    expect(payload).toBeNull();
  });

  it("sets maxAge and payload exp to 30 days", async () => {
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
