import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  checkRateLimit: vi.fn(),
  createServerClient: vi.fn(),
  fetchUserPasskeyParamsForUser: vi.fn(),
  logUnexpectedError: vi.fn(),
  requireCSRFToken: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/csrf", () => ({
  requireCSRFToken: mocks.requireCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@helvety/shared/user-passkey-params-db", () => ({
  fetchUserPasskeyParamsForUser: mocks.fetchUserPasskeyParamsForUser,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    CREDENTIAL_READ: { maxRequests: 5, windowMs: 300_000 },
    ENCRYPTION: { maxRequests: 3, windowMs: 300_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

import {
  getPasskeyParams,
  hasEncryptionSetup,
  saveKeyCheckValue,
} from "./encryption-actions";

describe("encryption-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: {},
      },
    });
    mocks.fetchUserPasskeyParamsForUser.mockResolvedValue({
      ok: true,
      params: null,
    });
    mocks.requireCSRFToken.mockResolvedValue(undefined);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });

    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ update })),
    });
  });

  it("maps read auth failures to legacy not-authenticated error", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: "Not authenticated" },
    });
    await expect(hasEncryptionSetup()).resolves.toEqual({
      success: false,
      error: "Not authenticated",
    });
  });

  it("returns true when user has params row", async () => {
    mocks.fetchUserPasskeyParamsForUser.mockResolvedValueOnce({
      ok: true,
      params: { prf_salt: "salt" },
    });
    await expect(hasEncryptionSetup()).resolves.toEqual({
      success: true,
      data: true,
    });
  });

  it("returns params from getPasskeyParams", async () => {
    mocks.fetchUserPasskeyParamsForUser.mockResolvedValueOnce({
      ok: true,
      params: { prf_salt: "abc", key_check_value: null },
    });
    await expect(getPasskeyParams()).resolves.toEqual({
      success: true,
      data: { prf_salt: "abc", key_check_value: null },
    });
  });

  it("rejects saveKeyCheckValue when CSRF check fails", async () => {
    mocks.requireCSRFToken.mockRejectedValueOnce(new Error("csrf"));
    await expect(saveKeyCheckValue("token", "kcv")).resolves.toEqual({
      success: false,
      error: "Security validation failed. Please sign in again.",
    });
  });

  it("rejects invalid key check value before DB calls", async () => {
    await expect(saveKeyCheckValue("token", "")).resolves.toEqual({
      success: false,
      error: "Invalid key check value",
    });
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("rejects when mutation rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      retryAfter: 42,
    });
    await expect(saveKeyCheckValue("token", "kcv")).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please wait 42 seconds before trying again.",
    });
  });
});
