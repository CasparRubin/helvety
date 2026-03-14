import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  clearChallenge: vi.fn(),
  createScopedAdminQuery: vi.fn(),
  createServerClient: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  getExpectedOrigins: vi.fn(),
  getRpId: vi.fn(),
  getStoredChallenge: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
  requireCSRFToken: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

vi.mock("@helvety/shared/csrf", () => ({
  requireCSRFToken: mocks.requireCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    info: vi.fn(),
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: mocks.generateRegistrationOptions,
  verifyRegistrationResponse: mocks.verifyRegistrationResponse,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    PASSKEY_REG: { maxRequests: 5, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("./auth-action-helpers", () => ({
  CHALLENGE_COOKIE_NAME: "webauthn_challenge",
  CHALLENGE_EXPIRY_MS: 180000,
  PRF_SALT_LENGTH: 32,
  RP_NAME: "Helvety",
  clearChallenge: mocks.clearChallenge,
  generatePRFSalt: vi.fn(() => "salt"),
  getExpectedOrigins: mocks.getExpectedOrigins,
  getRpId: mocks.getRpId,
  getStoredChallenge: mocks.getStoredChallenge,
  storeChallenge: vi.fn(),
}));

import { verifyPasskeyRegistration } from "./passkey-registration-actions";

describe("passkey-registration-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCSRFToken.mockResolvedValue(undefined);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.clearChallenge.mockResolvedValue(undefined);
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(),
      })),
    });
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })),
    });
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      userId: "user-1",
      prfSalt: "salt",
      timestamp: Date.now(),
    });
    mocks.getRpId.mockReturnValue("helvety.com");
    mocks.getExpectedOrigins.mockReturnValue(["https://helvety.com"]);
  });

  it("rejects malformed registration payloads and always clears challenge", async () => {
    const result = await verifyPasskeyRegistration(
      "csrf-token",
      { id: "cred-1" } as unknown as Parameters<
        typeof verifyPasskeyRegistration
      >[1],
      "https://helvety.com",
      true
    );

    expect(result).toEqual({
      success: false,
      error: "Invalid passkey registration payload",
    });
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });

  it("clears challenge on user mismatch failure", async () => {
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      userId: "other-user",
      prfSalt: "salt",
      timestamp: Date.now(),
    });

    const result = await verifyPasskeyRegistration(
      "csrf-token",
      {
        id: "cred-1",
        rawId: "raw-1",
        type: "public-key",
        response: {
          clientDataJSON: "client-data",
          attestationObject: "attestation",
        },
      },
      "https://helvety.com",
      true
    );

    expect(result).toEqual({
      success: false,
      error: "User mismatch",
    });
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });
});
