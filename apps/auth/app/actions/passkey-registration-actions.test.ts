import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  clearChallenge: vi.fn(),
  createScopedAdminQuery: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  getExpectedOrigins: vi.fn(),
  getRpId: vi.fn(),
  getStoredChallenge: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
  storeChallenge: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: mocks.loggerError,
    warn: mocks.loggerWarn,
    info: vi.fn(),
    logUnexpectedError: mocks.loggerError,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: mocks.generateRegistrationOptions,
  verifyRegistrationResponse: mocks.verifyRegistrationResponse,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    PASSKEY_REG: { maxRequests: 5, windowMs: 60_000 },
  },
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
  OriginUrlSchema: z.string().url(),
  storeChallenge: mocks.storeChallenge,
}));

import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "./passkey-registration-actions";

const CHALLENGE_TIMESTAMP = 1_700_000_000_000;

/** Builds a minimal valid passkey registration payload for tests. */
function buildRegistrationResponse(
  overrides?: Partial<Parameters<typeof verifyPasskeyRegistration>[1]>
): Parameters<typeof verifyPasskeyRegistration>[1] {
  return {
    id: "cred-1",
    rawId: "raw-1",
    type: "public-key",
    response: {
      clientDataJSON: "client-data",
      attestationObject: "attestation",
      transports: ["internal"],
    },
    ...overrides,
  };
}

describe("passkey-registration-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearChallenge.mockResolvedValue(undefined);
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(),
      })),
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: {
          from: vi.fn(() => ({
            upsert: vi.fn().mockResolvedValue({ error: null }),
          })),
        },
      },
    });
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      userId: "user-1",
      prfSalt: "salt",
      timestamp: CHALLENGE_TIMESTAMP,
    });
    mocks.getRpId.mockReturnValue("helvety.com");
    mocks.getExpectedOrigins.mockReturnValue(["https://helvety.com"]);
    mocks.storeChallenge.mockResolvedValue(undefined);
    mocks.generateRegistrationOptions.mockResolvedValue({
      challenge: "challenge-123",
      rp: { name: "Helvety", id: "helvety.com" },
      user: { id: "dXNlci0x", name: "user@example.com", displayName: "User" },
      pubKeyCredParams: [],
      timeout: 60_000,
      excludeCredentials: [],
    });
  });

  it("uses authenticateAndRateLimit and stores challenge in generate flow", async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ credential_id: "cred-1", transports: ["internal", "unknown"] }],
      error: null,
    });
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({ select })),
    });

    const result = await generatePasskeyRegistrationOptions(
      "csrf-token",
      "https://helvety.com/auth",
      { isMobile: true }
    );

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      csrfToken: "csrf-token",
      rateLimitPrefix: "passkey_reg",
      rateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
    });
    expect(mocks.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        rpID: "helvety.com",
        excludeCredentials: [{ id: "cred-1", transports: ["internal"] }],
      })
    );
    expect(mocks.storeChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: "challenge-123",
        userId: "user-1",
        prfSalt: "salt",
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects malformed registration payloads and always clears challenge", async () => {
    const result = await verifyPasskeyRegistration(
      "csrf-token",
      { id: "cred-1" } as Parameters<typeof verifyPasskeyRegistration>[1],
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
      timestamp: CHALLENGE_TIMESTAMP,
    });

    const result = await verifyPasskeyRegistration(
      "csrf-token",
      buildRegistrationResponse(),
      "https://helvety.com",
      true
    );

    expect(result).toEqual({
      success: false,
      error: "User mismatch",
    });
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });

  it("fails registration when encryption params persistence fails", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "user_auth_credentials") {
        return {
          insert,
          delete: vi.fn(() => ({
            eq: remove,
          })),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    mocks.createScopedAdminQuery.mockReturnValue({ from });
    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "cred-1",
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: [],
        },
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
      },
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: {
          from: vi.fn(() => ({
            upsert: vi.fn().mockResolvedValue({
              error: { message: "write failed" },
            }),
          })),
        },
      },
    });

    const result = await verifyPasskeyRegistration(
      "csrf-token",
      buildRegistrationResponse(),
      "https://helvety.com",
      true
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to complete encryption setup. Please try again.",
    });
    expect(insert).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("credential_id", "cred-1");
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });

  it("fails registration when PRF is enabled but challenge salt is missing", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "user_auth_credentials") {
        return {
          insert,
          delete: vi.fn(() => ({
            eq: remove,
          })),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    mocks.createScopedAdminQuery.mockReturnValue({ from });
    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "cred-2",
          publicKey: new Uint8Array([7, 8, 9]),
          counter: 1,
          transports: [],
        },
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
      },
    });
    mocks.getStoredChallenge.mockResolvedValue({
      challenge: "challenge-123",
      userId: "user-1",
      timestamp: CHALLENGE_TIMESTAMP,
    });

    const result = await verifyPasskeyRegistration(
      "csrf-token",
      buildRegistrationResponse({ id: "cred-2", rawId: "raw-2" }),
      "https://helvety.com",
      true
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to complete encryption setup. Please try again.",
    });
    expect(insert).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("credential_id", "cred-2");
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });

  it("filters unsupported transports before verification", async () => {
    mocks.verifyRegistrationResponse.mockResolvedValue({
      verified: false,
      registrationInfo: null,
    });

    await verifyPasskeyRegistration(
      "csrf-token",
      buildRegistrationResponse({
        response: {
          clientDataJSON: "client-data",
          attestationObject: "attestation",
          transports: ["internal", "invalid", "hybrid"],
        },
      }),
      "https://helvety.com",
      false
    );

    expect(mocks.verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({
          response: expect.objectContaining({
            transports: ["internal", "hybrid"],
          }),
        }),
      })
    );
  });
});
