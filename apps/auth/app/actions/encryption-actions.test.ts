import { buildAuthRequiredError } from "@helvety/shared/auth-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  fetchUserPasskeyParamsForUser: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/user-passkey-params-db", () => ({
  fetchUserPasskeyParamsForUser: mocks.fetchUserPasskeyParamsForUser,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    CREDENTIAL_READ: { maxRequests: 5, windowMs: 300_000 },
    ENCRYPTION: { maxRequests: 3, windowMs: 300_000 },
  },
}));

import {
  getPasskeyParams,
  hasEncryptionSetup,
  saveKeyCheckValue,
} from "./encryption-actions";

describe("encryption-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: {
          from: vi.fn(() => ({ update })),
        },
      },
    });
    mocks.fetchUserPasskeyParamsForUser.mockResolvedValue({
      ok: true,
      params: null,
    });
  });

  it("passes through authenticateAndRateLimit auth failures", async () => {
    const authError = buildAuthRequiredError();
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: authError },
    });
    await expect(hasEncryptionSetup()).resolves.toEqual({
      success: false,
      error: authError,
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

  it("uses auth-encryption rate limits for getPasskeyParams", async () => {
    await getPasskeyParams();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "auth-encryption",
      readRateLimitConfig: { maxRequests: 5, windowMs: 300_000 },
    });
  });

  it("rejects saveKeyCheckValue when CSRF check fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      },
    });
    await expect(saveKeyCheckValue("token", "kcv")).resolves.toEqual({
      success: false,
      error: "Security validation failed. Please refresh and try again.",
    });
  });

  it("rejects invalid key check value before auth", async () => {
    await expect(saveKeyCheckValue("token", "")).resolves.toEqual({
      success: false,
      error: "Invalid key check value",
    });
    expect(mocks.authenticateAndRateLimit).not.toHaveBeenCalled();
  });

  it("uses encryption mutation rate limits for saveKeyCheckValue", async () => {
    await saveKeyCheckValue("csrf-token", "kcv");

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "encryption",
      rateLimitConfig: { maxRequests: 3, windowMs: 300_000 },
      requireDeviceTrust: false,
    });
  });

  it("rejects when mutation rate limit is exceeded", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: {
        success: false,
        error: "Too many requests. Wait 42 seconds, then try again.",
      },
    });
    await expect(saveKeyCheckValue("token", "kcv")).resolves.toEqual({
      success: false,
      error: "Too many requests. Wait 42 seconds, then try again.",
    });
  });

  it("rejects saveKeyCheckValue when authenticateAndRateLimit has no user", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: buildAuthRequiredError() },
    });
    await expect(saveKeyCheckValue("token", "kcv")).resolves.toEqual({
      success: false,
      error: buildAuthRequiredError(),
    });
  });

  it("persists key check value on success", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn(() => ({ update })) },
      },
    });

    await expect(saveKeyCheckValue("csrf-token", "kcv-value")).resolves.toEqual(
      {
        success: true,
      }
    );
    expect(update).toHaveBeenCalledWith({ key_check_value: "kcv-value" });
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns failure when key check value update fails", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "db failed" } });
    const update = vi.fn(() => ({ eq }));
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn(() => ({ update })) },
      },
    });

    await expect(saveKeyCheckValue("csrf-token", "kcv-value")).resolves.toEqual(
      {
        success: false,
        error: "Failed to save key check value",
      }
    );
    expect(mocks.logUnexpectedError).toHaveBeenCalled();
  });
});
