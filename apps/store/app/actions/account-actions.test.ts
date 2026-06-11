import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const updateUser = vi.fn();
  const deleteUser = vi.fn();
  const getUserById = vi.fn();
  const select = vi.fn().mockReturnValue({ single: vi.fn() });
  const from = vi.fn(() => ({ select }));

  return {
    authenticateAndRateLimit: vi.fn(),
    createServerMutatingClient: vi.fn(),
    createScopedAdminQuery: vi.fn(),
    deleteUser,
    from,
    getUserById,
    hasAccountDeletionVerificationFailures: vi.fn(),
    logUnexpectedError: vi.fn(),
    loggerInfo: vi.fn(),
    select,
    updateUser,
    verifyDeletionResidualCounts: vi.fn(),
  };
});

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: vi.fn(),
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("@/lib/account-deletion-compliance", () => ({
  hasAccountDeletionVerificationFailures:
    mocks.hasAccountDeletionVerificationFailures,
}));

vi.mock("@/lib/account-deletion-verification", () => ({
  verifyDeletionResidualCounts: mocks.verifyDeletionResidualCounts,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    ACCOUNT_MUTATE: { maxRequests: 5, windowMs: 300_000 },
    DATA_EXPORT: { maxRequests: 3, windowMs: 300_000 },
  },
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerMutatingClient: mocks.createServerMutatingClient,
}));

import {
  exportUserData,
  requestAccountDeletion,
  updateUserEmail,
} from "./account-actions";

describe("account-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: {
          id: "user-1",
          email: "old@example.com",
          created_at: "2026-01-01",
        },
        supabase: {},
      },
    });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.createServerMutatingClient.mockResolvedValue({
      auth: { updateUser: mocks.updateUser },
    });

    mocks.createScopedAdminQuery.mockReturnValue({
      client: {
        auth: {
          admin: {
            deleteUser: mocks.deleteUser.mockResolvedValue({ error: null }),
            getUserById: mocks.getUserById.mockResolvedValue({
              data: { user: null },
              error: null,
            }),
          },
        },
      },
      from: mocks.from,
    });
    mocks.verifyDeletionResidualCounts.mockResolvedValue([]);
    mocks.hasAccountDeletionVerificationFailures.mockReturnValue(false);
    mocks.select.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          email: "old@example.com",
          display_name: "Alice",
          created_at: "2026-01-01",
        },
      }),
    });
  });

  it("validates email before auth calls", async () => {
    await expect(updateUserEmail("not-an-email", "csrf")).resolves.toEqual({
      success: false,
      error: "Invalid email format",
    });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("rejects same email update", async () => {
    await expect(updateUserEmail("old@example.com", "csrf")).resolves.toEqual({
      success: false,
      error: "New email must be different from current email",
    });
  });

  it("maps already-registered update errors", async () => {
    mocks.updateUser.mockResolvedValueOnce({
      error: { message: "already registered" },
    });
    await expect(updateUserEmail("new@example.com", "csrf")).resolves.toEqual({
      success: false,
      error: "This email is already in use",
    });
  });

  it("uses createServerMutatingClient for email updates", async () => {
    await updateUserEmail("new@example.com", "csrf");

    expect(mocks.createServerMutatingClient).toHaveBeenCalled();
    expect(mocks.updateUser).toHaveBeenCalledWith({ email: "new@example.com" });
  });

  it("forwards csrfToken and ACCOUNT_MUTATE limits on updateUserEmail", async () => {
    await updateUserEmail("new@example.com", "csrf-token");

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "acct",
      rateLimitConfig: { maxRequests: 5, windowMs: 300_000 },
    });
  });

  it("forwards csrfToken and ACCOUNT_MUTATE limits on requestAccountDeletion", async () => {
    await requestAccountDeletion("csrf-token");

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "acct",
      rateLimitConfig: { maxRequests: 5, windowMs: 300_000 },
    });
  });

  it("uses DATA_EXPORT readRateLimitConfig for exportUserData", async () => {
    await exportUserData();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "data-export",
      readRateLimitConfig: { maxRequests: 3, windowMs: 300_000 },
    });
  });

  it("completes account deletion when verification passes", async () => {
    const result = await requestAccountDeletion("csrf-token");

    expect(result).toEqual({ success: true });
    expect(mocks.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("fails deletion when verification detects residual issues", async () => {
    mocks.hasAccountDeletionVerificationFailures.mockReturnValueOnce(true);
    mocks.verifyDeletionResidualCounts.mockResolvedValueOnce([
      { table: "user_profiles", column: "user_id", count: 1, error: null },
    ]);
    await expect(requestAccountDeletion("csrf")).resolves.toEqual({
      success: false,
      error:
        "Account deletion was processed but verification found cleanup issues. Please contact support immediately.",
    });
  });

  it("exports profile data for authenticated users", async () => {
    const result = await exportUserData();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profile).toEqual({
        email: "old@example.com",
        displayName: "Alice",
        createdAt: "2026-01-01",
      });
    }
  });
});
