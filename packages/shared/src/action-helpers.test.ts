import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitMocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("./auth-retry", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("./csrf", () => ({
  requireCSRFToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./rate-limit", () => ({
  checkRateLimit: rateLimitMocks.checkRateLimit,
  RATE_LIMITS: {
    API: { maxRequests: 100, windowMs: 60_000 },
    READ: { maxRequests: 200, windowMs: 60_000 },
    EXPORT: { maxRequests: 5, windowMs: 60_000 },
  },
}));

vi.mock("./supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
}));

vi.mock("./device-trust-cookie", () => ({
  getValidDeviceTrustFromCookieStore: vi.fn(),
}));

import { authenticateAndRateLimit } from "./action-helpers";
import { getAuthUser } from "./auth-retry";
import { requireCSRFToken } from "./csrf";
import { getValidDeviceTrustFromCookieStore } from "./device-trust-cookie";

import type { AuthError, User } from "@supabase/supabase-js";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockRequireCSRFToken = vi.mocked(requireCSRFToken);
const mockGetValidDeviceTrustFromCookieStore = vi.mocked(
  getValidDeviceTrustFromCookieStore
);
const buildUser = (id: string): User => ({ id }) as User;
const buildAuthError = (message: string): AuthError =>
  ({ message }) as AuthError;

describe("authenticateAndRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mockRequireCSRFToken.mockResolvedValue(undefined);
    mockGetValidDeviceTrustFromCookieStore.mockReturnValue(null);
  });

  /**
   *
   */
  function mockDeviceTrustForUser(userId: string): void {
    mockGetValidDeviceTrustFromCookieStore.mockReturnValue({
      v: 1,
      userId,
      iat: 0,
      exp: 9_999_999_999,
    });
  }

  it("validates CSRF and uses mutation rate-limit config for write actions", async () => {
    const user = buildUser("write-user");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockDeviceTrustForUser("write-user");

    await authenticateAndRateLimit({
      csrfToken: "csrf-token",
      rateLimitPrefix: "tasks",
      rateLimitConfig: { maxRequests: 11, windowMs: 22_000 },
    });

    expect(mockRequireCSRFToken).toHaveBeenCalledWith("csrf-token");
    expect(rateLimitMocks.checkRateLimit).toHaveBeenCalledWith(
      "tasks:user:write-user",
      11,
      22_000
    );
  });

  it("returns early when CSRF validation fails", async () => {
    mockRequireCSRFToken.mockRejectedValueOnce(new Error("bad csrf"));

    const result = await authenticateAndRateLimit({
      csrfToken: "csrf-token",
      rateLimitPrefix: "tasks",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toContain("Security validation failed");
    }
    expect(mockGetAuthUser).not.toHaveBeenCalled();
    expect(rateLimitMocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns ok when auth succeeds", async () => {
    const user = buildUser("u1");
    mockGetAuthUser.mockResolvedValue({ user, error: null });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "test",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ctx.user).toBe(user);
    }
  });

  it("applies readRateLimitConfig to checkRateLimit for read-only actions", async () => {
    const user = buildUser("u1");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockDeviceTrustForUser("u1");

    await authenticateAndRateLimit({
      rateLimitPrefix: "export",
      readRateLimitConfig: { maxRequests: 5, windowMs: 12_000 },
    });

    expect(rateLimitMocks.checkRateLimit).toHaveBeenCalledWith(
      "export:read:u1",
      5,
      12_000
    );
  });

  it("defaults read path to RATE_LIMITS.READ when readRateLimitConfig omitted", async () => {
    const user = buildUser("u2");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockDeviceTrustForUser("u2");
    rateLimitMocks.checkRateLimit.mockClear();

    await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });

    expect(rateLimitMocks.checkRateLimit).toHaveBeenCalledWith(
      "contacts:read:u2",
      200,
      60_000
    );
  });

  it("returns mutation rate-limit error when write limit denies request", async () => {
    const user = buildUser("u3");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockDeviceTrustForUser("u3");
    rateLimitMocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfter: 33,
    });

    const result = await authenticateAndRateLimit({
      csrfToken: "csrf-token",
      rateLimitPrefix: "contacts",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toContain("Too many requests");
      expect(result.response.error).toContain("33");
    }
  });

  it("returns read rate-limit error when read limit denies request", async () => {
    const user = buildUser("u4");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockDeviceTrustForUser("u4");
    rateLimitMocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfter: 45,
    });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "export",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toContain("Too many requests");
      expect(result.response.error).toContain("45");
    }
  });

  it("returns AUTH_REQUIRED error for regular auth failures", async () => {
    mockGetAuthUser.mockResolvedValue({
      user: null,
      error: buildAuthError("jwt expired"),
    });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "test",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toMatch(/^AUTH_REQUIRED:/);
      expect(result.response.error).toContain("jwt expired");
    }
  });

  it("returns AUTH_HARD_LOGOUT error for terminal auth failures", async () => {
    mockGetAuthUser.mockResolvedValue({
      user: null,
      error: buildAuthError("refresh token not found"),
    });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "test",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toMatch(/^AUTH_HARD_LOGOUT:/);
      expect(result.response.error).toContain("refresh token not found");
    }
  });

  it("returns AUTH_HARD_LOGOUT when E2EE prefix lacks device trust", async () => {
    const user = buildUser("u5");
    mockGetAuthUser.mockResolvedValue({ user, error: null });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "tasks",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toMatch(/^AUTH_HARD_LOGOUT:/);
      expect(result.response.error).toContain("Device trust expired");
    }
    expect(rateLimitMocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns AUTH_HARD_LOGOUT when device trust userId mismatches authenticated user", async () => {
    const user = buildUser("u6");
    mockGetAuthUser.mockResolvedValue({ user, error: null });
    mockGetValidDeviceTrustFromCookieStore.mockReturnValue({
      v: 1,
      userId: "other-user-id",
      iat: 0,
      exp: 9_999_999_999,
    });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "tasks",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toMatch(/^AUTH_HARD_LOGOUT:/);
      expect(result.response.error).toContain("Device trust expired");
    }
    expect(rateLimitMocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns AUTH_REQUIRED with default message when error is null", async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: null });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "test",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.error).toBe("AUTH_REQUIRED:Not authenticated");
    }
  });
});
