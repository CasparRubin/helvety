import { describe, expect, it, vi } from "vitest";

vi.mock("./auth-retry", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("./csrf", () => ({
  requireCSRFToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: {
    API: { maxRequests: 100, windowMs: 60_000 },
    READ: { maxRequests: 200, windowMs: 60_000 },
  },
}));

vi.mock("./supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({}),
}));

import { authenticateAndRateLimit } from "./action-helpers";
import { getAuthUser } from "./auth-retry";

import type { AuthError, User } from "@supabase/supabase-js";

const mockGetAuthUser = vi.mocked(getAuthUser);

describe("authenticateAndRateLimit", () => {
  it("returns ok when auth succeeds", async () => {
    const user = { id: "u1" } as unknown as User;
    mockGetAuthUser.mockResolvedValue({ user, error: null });

    const result = await authenticateAndRateLimit({
      rateLimitPrefix: "test",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ctx.user).toBe(user);
    }
  });

  it("returns AUTH_REQUIRED error for regular auth failures", async () => {
    mockGetAuthUser.mockResolvedValue({
      user: null,
      error: { message: "jwt expired" } as unknown as AuthError,
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
      error: {
        message: "refresh token not found",
      } as unknown as AuthError,
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
