import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  fetchUserPasskeyParamsForUser: vi.fn(),
}));

vi.mock("./action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("./user-passkey-params-db", () => ({
  fetchUserPasskeyParamsForUser: mocks.fetchUserPasskeyParamsForUser,
}));

import { buildAuthRequiredError } from "./auth-errors";
import {
  getEncryptionParams,
  getPasskeyParams,
  getPasskeyParamsWithOptions,
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
  });

  it("getPasskeyParams uses the E2EE encryption rate-limit prefix", async () => {
    await getPasskeyParams();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "encryption",
    });
  });

  it("getPasskeyParamsWithOptions forwards custom rate-limit options", async () => {
    await getPasskeyParamsWithOptions({
      rateLimitPrefix: "auth-encryption",
      readRateLimitConfig: { maxRequests: 5, windowMs: 300_000 },
      fetchLogContext: "Error getting PRF params",
      loadErrorMessage: "Failed to load encryption params",
    });

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "auth-encryption",
      readRateLimitConfig: { maxRequests: 5, windowMs: 300_000 },
    });
  });

  it("getEncryptionParams returns passkey type when params exist", async () => {
    mocks.fetchUserPasskeyParamsForUser.mockResolvedValueOnce({
      ok: true,
      params: { prf_salt: "salt", key_check_value: null },
    });

    await expect(getEncryptionParams()).resolves.toEqual({
      success: true,
      data: {
        type: "passkey",
        passkeyParams: { prf_salt: "salt", key_check_value: null },
      },
    });
  });

  it("getEncryptionParams propagates auth failures from getPasskeyParams", async () => {
    const authError = buildAuthRequiredError();
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: authError },
    });

    await expect(getEncryptionParams()).resolves.toEqual({
      success: false,
      error: authError,
    });
  });
});
