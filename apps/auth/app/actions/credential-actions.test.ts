import { buildAuthRequiredError } from "@helvety/shared/auth-errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  checkUserPasskeyStatus: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("./auth-action-helpers", () => ({
  checkUserPasskeyStatus: mocks.checkUserPasskeyStatus,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    CREDENTIAL_READ: { maxRequests: 30, windowMs: 60_000 },
  },
}));

import { getOwnPasskeyStatus } from "./credential-actions";

describe("credential-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: {} },
    });
    mocks.checkUserPasskeyStatus.mockResolvedValue({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
  });

  it("passes through authenticateAndRateLimit auth failures", async () => {
    const authError = buildAuthRequiredError();
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: { success: false, error: authError },
    });

    const result = await getOwnPasskeyStatus();

    expect(result).toEqual({ success: false, error: authError });
    expect(mocks.checkUserPasskeyStatus).not.toHaveBeenCalled();
  });

  it("passes through rate-limit failures", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValueOnce({
      ok: false,
      response: {
        success: false,
        error: "Too many requests. Try again later.",
      },
    });

    const result = await getOwnPasskeyStatus();

    expect(result.success).toBe(false);
    expect(mocks.checkUserPasskeyStatus).not.toHaveBeenCalled();
  });

  it("uses authenticateAndRateLimit with CREDENTIAL_READ", async () => {
    await getOwnPasskeyStatus();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "auth-credentials",
      readRateLimitConfig: { maxRequests: 30, windowMs: 60_000 },
    });
  });

  it("delegates to checkUserPasskeyStatus for the session user", async () => {
    const result = await getOwnPasskeyStatus();

    expect(mocks.checkUserPasskeyStatus).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
  });

  it("returns passkey status failures from checkUserPasskeyStatus", async () => {
    mocks.checkUserPasskeyStatus.mockResolvedValueOnce({
      success: false,
      error: "Failed to check passkey status",
    });

    const result = await getOwnPasskeyStatus();

    expect(result).toEqual({
      success: false,
      error: "Failed to check passkey status",
    });
  });
});
