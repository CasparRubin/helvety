import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const credentialEq = vi.fn();
  const credentialSingle = vi.fn();
  const credentialSelect = vi.fn((fields: string) => {
    if (fields === "*") {
      return {
        eq: vi.fn(() => ({
          single: credentialSingle,
        })),
      };
    }
    return credentialEq();
  });

  return {
    adminFrom: vi.fn(() => ({ select: credentialSelect })),
    adminGenerateLink: vi.fn(),
    adminGetUserById: vi.fn(),
    adminRpc: vi.fn(),
    checkRateLimit: vi.fn(),
    clearChallenge: vi.fn(),
    credentialEq,
    credentialSingle,
    generateAuthenticationOptions: vi.fn(),
    generateCSRFToken: vi.fn(),
    getClientIP: vi.fn(),
    getExpectedOrigins: vi.fn(),
    getRpId: vi.fn(),
    getStoredChallenge: vi.fn(),
    requireCSRFToken: vi.fn(),
    resetRateLimit: vi.fn(),
    storeChallenge: vi.fn(),
    supabaseVerifyOtp: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
  };
});

vi.mock("@helvety/shared/auth-logger", () => ({
  logAuthEvent: vi.fn(),
}));

vi.mock("@helvety/shared/config", () => ({
  urls: { home: "https://helvety.com" },
}));

vi.mock("@helvety/shared/csrf", () => ({
  generateCSRFToken: mocks.generateCSRFToken,
  requireCSRFToken: mocks.requireCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@helvety/shared/redirect-validation", () => ({
  getSafeRedirectUri: vi
    .fn()
    .mockImplementation((uri: string | undefined, fallback?: string) => {
      return uri ?? fallback ?? null;
    }),
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    rpc: mocks.adminRpc,
    from: mocks.adminFrom,
    auth: {
      admin: {
        getUserById: mocks.adminGetUserById,
        generateLink: mocks.adminGenerateLink,
      },
    },
  })),
  createScopedAdminQuery: vi.fn(() => ({
    from: mocks.adminFrom,
  })),
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      verifyOtp: mocks.supabaseVerifyOtp,
    },
  })),
}));

vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions: mocks.generateAuthenticationOptions,
  verifyAuthenticationResponse: mocks.verifyAuthenticationResponse,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    PASSKEY: { maxRequests: 10, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock("./auth-action-helpers", () => ({
  clearChallenge: mocks.clearChallenge,
  getClientIP: mocks.getClientIP,
  getExpectedOrigins: mocks.getExpectedOrigins,
  getRpId: mocks.getRpId,
  getStoredChallenge: mocks.getStoredChallenge,
  storeChallenge: mocks.storeChallenge,
}));

import {
  generatePasskeyAuthOptions,
  verifyPasskeyAuthentication,
} from "./passkey-auth-actions";

describe("passkey-auth-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireCSRFToken.mockResolvedValue(undefined);
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.resetRateLimit.mockResolvedValue(undefined);
    mocks.getClientIP.mockResolvedValue("127.0.0.1");
    mocks.getRpId.mockReturnValue("helvety.com");
    mocks.getExpectedOrigins.mockReturnValue(["https://helvety.com"]);
    mocks.generateAuthenticationOptions.mockResolvedValue({
      challenge: "challenge-123",
      rpId: "helvety.com",
    });
    mocks.storeChallenge.mockResolvedValue(undefined);
    mocks.clearChallenge.mockResolvedValue(undefined);
    mocks.generateCSRFToken.mockResolvedValue(undefined);
    mocks.supabaseVerifyOtp.mockResolvedValue({ error: null });
    mocks.adminGetUserById.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
      error: null,
    });
    mocks.adminGenerateLink.mockResolvedValue({
      data: {
        properties: {
          hashed_token: "token",
          verification_type: "magiclink",
        },
      },
      error: null,
    });
  });

  it("restricts auth options to expected account credentials", async () => {
    mocks.adminRpc.mockResolvedValue({
      data: [{ id: "user-1", email: "user@example.com" }],
      error: null,
    });
    mocks.credentialEq.mockResolvedValue({
      data: [
        { credential_id: "cred-a", transports: ["internal"] },
        { credential_id: "cred-b", transports: ["hybrid"] },
      ],
      error: null,
    });

    const result = await generatePasskeyAuthOptions(
      "csrf-token",
      "https://helvety.com",
      "https://helvety.com/tasks",
      { expectedEmail: "User@Example.com", isMobile: false }
    );

    expect(result.success).toBe(true);
    expect(mocks.generateAuthenticationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        allowCredentials: [
          { id: "cred-a", transports: ["internal"] },
          { id: "cred-b", transports: ["hybrid"] },
        ],
      })
    );
    expect(mocks.storeChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: "challenge-123",
        expectedEmail: "user@example.com",
        expectedUserId: "user-1",
      })
    );
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect("prfSalt" in result.data).toBe(false);
      expect("prfVersion" in result.data).toBe(false);
    }
  });

  it("returns mismatch when credential owner differs from expected user", async () => {
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      expectedUserId: "user-1",
      expectedEmail: "user@example.com",
      redirectUri: "https://helvety.com/tasks",
      timestamp: Date.now(),
    });

    mocks.credentialSingle.mockResolvedValue({
      data: {
        credential_id: "cred-b",
        public_key: Buffer.from("public-key").toString("base64url"),
        counter: 1,
        transports: ["internal"],
        user_id: "user-2",
      },
      error: null,
    });

    const response = {
      id: "cred-b",
    } as unknown as Parameters<typeof verifyPasskeyAuthentication>[1];

    const result = await verifyPasskeyAuthentication(
      "csrf-token",
      response,
      "https://helvety.com"
    );

    expect(result).toEqual({
      success: false,
      error: "PASSKEY_ACCOUNT_MISMATCH",
    });
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });
});
