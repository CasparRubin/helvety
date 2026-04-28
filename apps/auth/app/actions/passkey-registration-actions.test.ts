import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  clearChallenge: vi.fn(),
  createScopedAdminQuery: vi.fn(),
  createServerClient: vi.fn(),
  generateRegistrationOptions: vi.fn(),
  getExpectedOrigins: vi.fn(),
  getRpId: vi.fn(),
  getStoredChallenge: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
  runAuthActionGuards: vi.fn(),
  runRateLimitGuard: vi.fn(),
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
  runAuthActionGuards: mocks.runAuthActionGuards,
  runRateLimitGuard: mocks.runRateLimitGuard,
  storeChallenge: vi.fn(),
}));

import { verifyPasskeyRegistration } from "./passkey-registration-actions";

describe("passkey-registration-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runAuthActionGuards.mockResolvedValue({ ok: true, clientIP: null });
    mocks.runRateLimitGuard.mockResolvedValue({ ok: true });
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
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({
          error: { message: "write failed" },
        }),
      })),
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
      timestamp: Date.now(),
    });

    const result = await verifyPasskeyRegistration(
      "csrf-token",
      {
        id: "cred-2",
        rawId: "raw-2",
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
      error: "Failed to complete encryption setup. Please try again.",
    });
    expect(insert).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("credential_id", "cred-2");
    expect(mocks.clearChallenge).toHaveBeenCalledOnce();
  });
});
