import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieMocks = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn((name: string) => {
      const value = store.get(name);
      return value ? { name, value } : undefined;
    }),
  };
});

vi.mock("./cached-server", () => ({
  getCachedAuthLookup: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: () => null,
  }),
  cookies: vi.fn().mockResolvedValue(cookieMocks),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new MockRedirect(url);
  }),
}));

vi.mock("./request-origin", () => ({
  resolveRequestOrigin: () => null,
}));

/** Thrown by the mocked redirect() to capture the destination URL. */
class MockRedirect {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}

import { requireAuth } from "./auth-guard";
import { getCachedAuthLookup } from "./cached-server";
import {
  DEVICE_TRUST_COOKIE_NAME,
  encodeDeviceTrustCookieValue,
} from "./device-trust-cookie";

import type { AuthError, User } from "@supabase/supabase-js";

const mockGetCachedAuthLookup = vi.mocked(getCachedAuthLookup);
const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");
const TRUSTED_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

beforeEach(() => {
  cookieMocks.store.clear();
  process.env.DEVICE_TRUST_COOKIE_SECRET = DEVICE_TRUST_SECRET;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("returns the user when authenticated", async () => {
    const user = { id: "u1", email: "a@b.com" } as unknown as User;
    mockGetCachedAuthLookup.mockResolvedValue({ user, error: null });

    const result = await requireAuth("/tasks");
    expect(result).toBe(user);
  });

  it("redirects to global logout when device trust is required but missing", async () => {
    const user = { id: TRUSTED_USER_ID, email: "a@b.com" } as unknown as User;
    mockGetCachedAuthLookup.mockResolvedValue({ user, error: null });
    const authPromise = requireAuth("/tasks", { requireDeviceTrust: true });

    await expect(authPromise).rejects.toBeInstanceOf(MockRedirect);
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("/auth/logout"),
    });
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("scope=global"),
    });
  });

  it("returns the user when device trust matches the authenticated user", async () => {
    const user = { id: TRUSTED_USER_ID, email: "a@b.com" } as unknown as User;
    mockGetCachedAuthLookup.mockResolvedValue({ user, error: null });
    cookieMocks.store.set(
      DEVICE_TRUST_COOKIE_NAME,
      encodeDeviceTrustCookieValue(TRUSTED_USER_ID)
    );

    const result = await requireAuth("/tasks", { requireDeviceTrust: true });
    expect(result).toBe(user);
  });

  it("redirects to global logout when device trust userId does not match session user", async () => {
    const user = { id: TRUSTED_USER_ID, email: "a@b.com" } as unknown as User;
    mockGetCachedAuthLookup.mockResolvedValue({ user, error: null });
    cookieMocks.store.set(
      DEVICE_TRUST_COOKIE_NAME,
      encodeDeviceTrustCookieValue(OTHER_USER_ID)
    );

    const authPromise = requireAuth("/tasks", { requireDeviceTrust: true });
    await expect(authPromise).rejects.toBeInstanceOf(MockRedirect);
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("/auth/logout"),
    });
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("scope=global"),
    });
  });

  it("redirects to login when no user and no error", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({ user: null, error: null });
    const authPromise = requireAuth("/tasks");

    await expect(authPromise).rejects.toBeInstanceOf(MockRedirect);
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("/auth/login"),
    });
  });

  it("redirects to global logout for hard-logout errors", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({
      user: null,
      error: {
        message: "refresh token not found",
      } as unknown as AuthError,
    });
    const authPromise = requireAuth("/tasks");

    await expect(authPromise).rejects.toBeInstanceOf(MockRedirect);
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("/auth/logout"),
    });
    await expect(authPromise).rejects.toMatchObject({
      url: expect.stringContaining("scope=global"),
    });
  });

  it("makes only one cached auth lookup (no fallback)", async () => {
    mockGetCachedAuthLookup.mockResolvedValue({
      user: null,
      error: { message: "some error" } as unknown as AuthError,
    });

    await expect(requireAuth("/tasks")).rejects.toThrow(MockRedirect);
    expect(mockGetCachedAuthLookup).toHaveBeenCalledTimes(1);
  });
});
