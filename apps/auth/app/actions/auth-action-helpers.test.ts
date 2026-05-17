import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieState = { value: undefined as string | undefined };
  const cookieStore = {
    delete: vi.fn(),
    get: vi.fn(() =>
      cookieState.value
        ? { name: "webauthn_challenge", value: cookieState.value }
        : undefined
    ),
    set: vi.fn((_name: string, value: string) => {
      cookieState.value = value;
    }),
  };

  return {
    checkRateLimit: vi.fn(),
    cookieState,
    cookieStore,
    createScopedAdminQuery: vi.fn(),
    getTrustedClientIp: vi.fn(),
    headers: vi.fn(),
    logUnexpectedError: vi.fn(),
    requireCSRFToken: vi.fn(),
  };
});

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("@helvety/shared/csrf", () => ({
  requireCSRFToken: mocks.requireCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mocks.cookieStore),
  headers: mocks.headers,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

import {
  NormalizedEmailSchema,
  checkUserPasskeyStatus,
  clearChallenge,
  generatePRFSalt,
  getStoredChallenge,
  runAuthActionGuards,
  runRateLimitGuard,
  storeChallenge,
} from "./auth-action-helpers";

describe("auth-action-helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieState.value = undefined;
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test_cookie_signing_secret_for_challenge_cookies_1234567890";
    mocks.requireCSRFToken.mockResolvedValue(undefined);
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.1");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "cred-1" }],
          error: null,
          count: 1,
        }),
      })),
    });
  });

  it("normalizes email values", () => {
    expect(NormalizedEmailSchema.parse("  User@Example.COM ")).toBe(
      "user@example.com"
    );
  });

  it("runs guards and returns fail-closed when CSRF fails", async () => {
    mocks.requireCSRFToken.mockRejectedValueOnce(new Error("csrf"));
    await expect(
      runAuthActionGuards({ csrfToken: "bad-token", requireClientIP: false })
    ).resolves.toEqual({
      ok: false,
      response: {
        success: false,
        error: "Security validation failed. Please sign in again.",
      },
    });
  });

  it("runs guards and blocks when IP is unavailable", async () => {
    mocks.getTrustedClientIp.mockReturnValueOnce(null);
    await expect(runAuthActionGuards({ csrfToken: "token" })).resolves.toEqual({
      ok: false,
      response: {
        success: false,
        error: "Unable to process request. Please try again.",
      },
    });
  });

  it("returns retry message in rate-limit guard", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfter: 19,
    });
    await expect(
      runRateLimitGuard({ key: "k", maxRequests: 1, windowMs: 1_000 })
    ).resolves.toEqual({
      ok: false,
      retryAfter: 19,
      response: {
        success: false,
        error: "Too many requests. Wait 19 seconds, then try again.",
      },
    });
  });

  it("rejects challenge cookies when HELVETY_COOKIE_SIGNING_SECRET is missing", async () => {
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;

    await expect(
      storeChallenge({
        challenge: "ch",
        userId: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).rejects.toThrow(/HELVETY_COOKIE_SIGNING_SECRET/i);
  });

  it("stores, reads, and clears challenge cookies", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await storeChallenge({
      challenge: "ch",
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });
    await expect(getStoredChallenge()).resolves.toMatchObject({
      challenge: "ch",
    });
    await clearChallenge();
    expect(mocks.cookieStore.delete).toHaveBeenCalledWith("webauthn_challenge");
    vi.useRealTimers();
  });

  it("rejects tampered challenge cookies", async () => {
    await storeChallenge({
      challenge: "ch",
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });
    const original = mocks.cookieState.value;
    expect(original).toBeTruthy();
    mocks.cookieState.value = `${original}tampered`;

    await expect(getStoredChallenge()).resolves.toBeNull();
  });

  it("checks passkey status from scoped admin query", async () => {
    await expect(
      checkUserPasskeyStatus("550e8400-e29b-41d4-a716-446655440000")
    ).resolves.toEqual({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
  });

  it("generates base64 PRF salts", () => {
    const salt = generatePRFSalt();
    expect(typeof salt).toBe("string");
    expect(salt.length).toBeGreaterThan(0);
  });
});
