import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    cookieStore: {
      get: vi.fn((name: string) => {
        const value = store.get(name);
        return value ? { name, value } : undefined;
      }),
      set: vi.fn((name: string, value: string) => {
        store.set(name, value);
      }),
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
});
