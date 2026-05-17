import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => {
  const credentialEq = vi.fn();
  const credentialSingle = vi.fn();
  const credentialUpdateMaybeSingle = vi.fn();
  const credentialUpdateSelect = vi.fn(() => ({
    maybeSingle: credentialUpdateMaybeSingle,
  }));
  const credentialUpdateEq2 = vi.fn(() => ({
    select: credentialUpdateSelect,
  }));
  const credentialUpdateEq1 = vi.fn(() => ({
    eq: credentialUpdateEq2,
  }));
  const credentialUpdate = vi.fn(() => ({
    eq: credentialUpdateEq1,
  }));
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
    adminFrom: vi.fn(() => ({
      select: credentialSelect,
      update: credentialUpdate,
    })),
    adminGenerateLink: vi.fn(),
    adminGetUserById: vi.fn(),
    adminRpc: vi.fn(),
    clearChallenge: vi.fn(),
    credentialEq,
    credentialSingle,
    credentialUpdateMaybeSingle,
    generateAuthenticationOptions: vi.fn(),
    generateCSRFToken: vi.fn(),
    getExpectedOrigins: vi.fn(),
    getRpId: vi.fn(),
    getStoredChallenge: vi.fn(),
    runAuthActionGuards: vi.fn(),
    runRateLimitGuard: vi.fn(),
    resetRateLimit: vi.fn(),
    storeChallenge: vi.fn(),
    supabaseVerifyOtp: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
    clearDeviceTrustCookie: vi.fn(),
    getValidDeviceTrustCookie: vi.fn(),
    setDeviceTrustCookie: vi.fn(),
  };
});

vi.mock("@helvety/shared/auth-logger", () => ({
  AUTH_ACTIONS: {
    generatePasskeyAuthOptions: "generatePasskeyAuthOptions",
    verifyPasskeyAuthentication: "verifyPasskeyAuthentication",
  },
  AUTH_REASONS: {
    expectedUserNotFound: "expected_user_not_found",
    challengeExpired: "challenge_expired",
    credentialNotFound: "credential_not_found",
    credentialOwnerMismatch: "credential_owner_mismatch",
    credentialEmailMismatch: "credential_email_mismatch",
    verificationError: "verification_error",
    verificationFailed: "verification_failed",
    unexpectedError: "unexpected_error",
  },
  logAuthEvent: vi.fn(),
}));

vi.mock("@helvety/shared/config", () => ({
  urls: { home: "https://helvety.com" },
}));

vi.mock("@helvety/shared/csrf", () => ({
  generateCSRFToken: mocks.generateCSRFToken,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    logUnexpectedError: vi.fn(),
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
  lookupCredentialByCredentialId: vi.fn(() => mocks.credentialSingle()),
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
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock("./auth-action-helpers", () => ({
  clearChallenge: mocks.clearChallenge,
  getExpectedOrigins: mocks.getExpectedOrigins,
  getRpId: mocks.getRpId,
  getStoredChallenge: mocks.getStoredChallenge,
  OriginUrlSchema: z.url(),
  runAuthActionGuards: mocks.runAuthActionGuards,
  runRateLimitGuard: mocks.runRateLimitGuard,
  storeChallenge: mocks.storeChallenge,
}));

vi.mock("./device-trust-cookie", () => ({
  clearDeviceTrustCookie: mocks.clearDeviceTrustCookie,
  getValidDeviceTrustCookie: mocks.getValidDeviceTrustCookie,
  setDeviceTrustCookie: mocks.setDeviceTrustCookie,
}));

import {
  generatePasskeyAuthOptions,
  verifyPasskeyAuthentication,
} from "./passkey-auth-actions";

const CHALLENGE_TIMESTAMP = 1_700_000_000_000;

/** Builds a minimal valid passkey verification payload for tests. */
function buildVerifyResponse(
  overrides?: Partial<Parameters<typeof verifyPasskeyAuthentication>[1]>
): Parameters<typeof verifyPasskeyAuthentication>[1] {
  return {
    id: "cred-a",
    rawId: "raw-a",
    type: "public-key",
    response: {
      clientDataJSON: "client-data",
      authenticatorData: "auth-data",
      signature: "signature",
      userHandle: null,
    },
    ...overrides,
  };
}

describe("passkey-auth-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.runAuthActionGuards.mockResolvedValue({
      ok: true,
      clientIP: "127.0.0.1",
    });
    mocks.runRateLimitGuard.mockResolvedValue({ ok: true });
    mocks.resetRateLimit.mockResolvedValue(undefined);
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
    mocks.getValidDeviceTrustCookie.mockResolvedValue(null);
    mocks.credentialUpdateMaybeSingle.mockResolvedValue({
      data: { credential_id: "cred-a" },
      error: null,
    });
  });

  it("rejects generatePasskeyAuthOptions when client IP is unresolvable", async () => {
    mocks.runAuthActionGuards.mockResolvedValue({
      ok: false,
      response: {
        success: false,
        error: "Unable to process request. Please try again.",
      },
    });

    const result = await generatePasskeyAuthOptions(
      "csrf-token",
      "https://helvety.com"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to process request. Please try again.",
    });
    expect(mocks.runRateLimitGuard).not.toHaveBeenCalled();
  });

  it("rejects verifyPasskeyAuthentication when client IP is unresolvable", async () => {
    mocks.runAuthActionGuards.mockResolvedValue({
      ok: false,
      response: {
        success: false,
        error: "Unable to process request. Please try again.",
      },
    });

    const result = await verifyPasskeyAuthentication(
      "csrf-token",
      buildVerifyResponse(),
      "https://helvety.com"
    );

    expect(result).toEqual({
      success: false,
      error: "Unable to process request. Please try again.",
    });
    expect(mocks.runRateLimitGuard).not.toHaveBeenCalled();
  });

  it("returns generic error when expected user has no passkey credentials", async () => {
    mocks.adminRpc.mockResolvedValue({
      data: [{ id: "user-1", email: "user@example.com" }],
      error: null,
    });
    mocks.credentialEq.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await generatePasskeyAuthOptions(
      "csrf-token",
      "https://helvety.com",
      undefined,
      { expectedEmail: "user@example.com" }
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Unable to start passkey authentication. Please try signing in with email."
      );
    }
  });

  it("returns generic error when credential is not found during verification", async () => {
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      timestamp: CHALLENGE_TIMESTAMP,
    });
    mocks.credentialSingle.mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });

    const result = await verifyPasskeyAuthentication(
      "csrf-token",
      buildVerifyResponse({ id: "cred-nonexistent" }),
      "https://helvety.com"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Passkey authentication failed. Please try again."
      );
    }
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

  it("restricts auth options to trusted user credentials when expectedUserId is provided", async () => {
    mocks.credentialEq.mockResolvedValue({
      data: [{ credential_id: "cred-a", transports: ["internal"] }],
      error: null,
    });

    const result = await generatePasskeyAuthOptions(
      "csrf-token",
      "https://helvety.com",
      "https://helvety.com/tasks",
      { expectedUserId: "550e8400-e29b-41d4-a716-446655440000" }
    );

    expect(result.success).toBe(true);
    expect(mocks.generateAuthenticationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        allowCredentials: [{ id: "cred-a", transports: ["internal"] }],
      })
    );
  });

  it("renews trust when valid trust cookie matches authenticated user", async () => {
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      redirectUri: "https://helvety.com/tasks",
      timestamp: CHALLENGE_TIMESTAMP,
    });
    mocks.credentialSingle.mockResolvedValue({
      data: {
        credential_id: "cred-a",
        public_key: Buffer.from("public-key").toString("base64url"),
        counter: 1,
        transports: ["internal"],
        user_id: "user-1",
      },
      error: null,
    });
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 2 },
    });
    mocks.credentialEq.mockResolvedValue({
      data: { credential_id: "cred-a" },
      error: null,
    });
    mocks.getValidDeviceTrustCookie.mockResolvedValue({
      v: 1,
      userId: "user-1",
      iat: 1,
      exp: 2,
    });

    const result = await verifyPasskeyAuthentication(
      "csrf-token",
      buildVerifyResponse({ id: "cred-a" }),
      "https://helvety.com"
    );

    expect(result.success).toBe(true);
    expect(mocks.setDeviceTrustCookie).toHaveBeenCalledWith("user-1");
    expect(mocks.clearDeviceTrustCookie).not.toHaveBeenCalled();
  });

  it("filters unsupported transports before generating auth options", async () => {
    mocks.adminRpc.mockResolvedValue({
      data: [{ id: "user-1", email: "user@example.com" }],
      error: null,
    });
    mocks.credentialEq.mockResolvedValue({
      data: [
        {
          credential_id: "cred-a",
          transports: ["internal", "invalid-transport", "hybrid"],
        },
      ],
      error: null,
    });

    const result = await generatePasskeyAuthOptions(
      "csrf-token",
      "https://helvety.com",
      undefined,
      { expectedEmail: "user@example.com" }
    );

    expect(result.success).toBe(true);
    expect(mocks.generateAuthenticationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        allowCredentials: [
          { id: "cred-a", transports: ["internal", "hybrid"] },
        ],
      })
    );
  });

  it("returns mismatch when credential owner differs from expected user", async () => {
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      expectedUserId: "user-1",
      expectedEmail: "user@example.com",
      redirectUri: "https://helvety.com/tasks",
      timestamp: CHALLENGE_TIMESTAMP,
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

    const result = await verifyPasskeyAuthentication(
      "csrf-token",
      buildVerifyResponse({ id: "cred-b" }),
      "https://helvety.com"
    );

    expect(result).toEqual({
      success: false,
      error: "PASSKEY_ACCOUNT_MISMATCH",
    });
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });
});
