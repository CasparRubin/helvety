import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const chromeOriginMocks = vi.hoisted(() => ({
  isAllowedChromeExtensionOrigin: vi.fn(
    (origin: string) =>
      origin === "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef"
  ),
}));

const mocks = vi.hoisted(() => {
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
  const credentialFrom = vi.fn(() => ({
    select: vi.fn().mockResolvedValue({
      data: [
        {
          credential_id: "cred-a",
          transports: ["internal"],
        },
      ],
      error: null,
    }),
    update: credentialUpdate,
  }));

  return {
    credentialFrom,
    credentialUpdate,
    credentialUpdateMaybeSingle,
    generateAuthenticationOptions: vi.fn(),
    getExpectedOrigins: vi.fn(),
    getRpId: vi.fn(),
    lookupCredentialByCredentialId: vi.fn(),
    resetRateLimit: vi.fn(),
    verifyAuthenticationResponse: vi.fn(),
  };
});

vi.mock("@helvety/shared/auth-logger", () => ({
  AUTH_REASONS: {
    challengeExpired: "challenge_expired",
    credentialNotFound: "credential_not_found",
    credentialOwnerMismatch: "credential_owner_mismatch",
    verificationFailed: "verification_failed",
    unexpectedError: "unexpected_error",
  },
  logAuthEvent: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: vi.fn() },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: vi.fn(() => ({
    from: mocks.credentialFrom,
  })),
  lookupCredentialByCredentialId: mocks.lookupCredentialByCredentialId,
}));

vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions: mocks.generateAuthenticationOptions,
  verifyAuthenticationResponse: mocks.verifyAuthenticationResponse,
}));

const singleUseConsumedKeys = new Set<string>();

vi.mock("@helvety/shared/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
  consumeSingleUseKey: vi.fn(async (storageKey: string) => {
    if (singleUseConsumedKeys.has(storageKey)) {
      return false;
    }
    singleUseConsumedKeys.add(storageKey);
    return true;
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    PASSKEY: { maxRequests: 10, windowMs: 60_000 },
  },
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock("@/app/actions/auth-rp-config", () => ({
  getRpId: mocks.getRpId,
  getExpectedOrigins: mocks.getExpectedOrigins,
}));

vi.mock("@/lib/chrome-extension-origin", () => ({
  isAllowedChromeExtensionOrigin:
    chromeOriginMocks.isAllowedChromeExtensionOrigin,
}));

import {
  generateExtensionPasskeyOptions,
  verifyExtensionPasskey,
} from "./extension-passkey";
import {
  challengeFromClientDataJSON,
  verifyExtensionChallengeEnvelope,
} from "./extension-passkey-challenge";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
const CHALLENGE = "server-challenge-value";
const CLIENT_IP = "203.0.113.10";

/** Builds base64url clientDataJSON for WebAuthn assertion tests. */
function clientDataJSONForChallenge(challenge: string): string {
  return Buffer.from(
    JSON.stringify({ type: "webauthn.get", challenge, origin: ORIGIN }),
    "utf8"
  ).toString("base64url");
}

describe("extension-passkey", () => {
  beforeEach(() => {
    singleUseConsumedKeys.clear();
    vi.clearAllMocks();
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test-signing-secret-32chars-min";

    mocks.getRpId.mockReturnValue("helvety.com");
    mocks.getExpectedOrigins.mockReturnValue(["https://helvety.com", ORIGIN]);
    mocks.resetRateLimit.mockResolvedValue(undefined);
    mocks.generateAuthenticationOptions.mockResolvedValue({
      challenge: CHALLENGE,
      rpId: "helvety.com",
      timeout: 60_000,
    });
    mocks.lookupCredentialByCredentialId.mockResolvedValue({
      data: {
        user_id: USER_ID,
        credential_id: "cred-a",
        public_key: Buffer.from("public-key-bytes").toString("base64url"),
        counter: 1,
        backed_up: true,
        transports: ["internal"],
      },
      error: null,
    });
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 2 },
    });
    mocks.credentialUpdateMaybeSingle.mockResolvedValue({
      data: { credential_id: "cred-a" },
      error: null,
    });
  });

  afterEach(() => {
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
  });

  it("returns WebAuthn options and a signed challengeEnvelope", async () => {
    const result = await generateExtensionPasskeyOptions({
      userId: USER_ID,
      origin: ORIGIN,
      isMobile: false,
      clientIP: CLIENT_IP,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.options.challenge).toBe(CHALLENGE);
    expect(result.data.options.hints).toEqual(["hybrid"]);
    expect(result.data.challengeEnvelope).toBeTruthy();
    expect(
      await verifyExtensionChallengeEnvelope(result.data.challengeEnvelope, {
        userId: USER_ID,
        origin: ORIGIN,
      })
    ).toEqual({ challenge: CHALLENGE });
  });

  it("rejects verify when challengeEnvelope is invalid", async () => {
    const result = await verifyExtensionPasskey({
      userId: USER_ID,
      origin: ORIGIN,
      challengeEnvelope: "not-a-valid-envelope",
      credential: {
        id: "cred-a",
        rawId: "raw-a",
        type: "public-key",
        response: {
          clientDataJSON: clientDataJSONForChallenge(CHALLENGE),
          authenticatorData: "auth-data",
          signature: "sig",
        },
      },
      clientIP: CLIENT_IP,
    });

    expect(result).toEqual({
      success: false,
      error: "Passkey authentication failed. Please try again.",
    });
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it("rejects options when origin is not on the extension allowlist", async () => {
    const result = await generateExtensionPasskeyOptions({
      userId: USER_ID,
      origin: "chrome-extension://not-on-allowlist000000000000",
      clientIP: CLIENT_IP,
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid or disallowed origin URL",
    });
    expect(mocks.generateAuthenticationOptions).not.toHaveBeenCalled();
  });

  it("rejects verify when assertion challenge does not match envelope", async () => {
    const options = await generateExtensionPasskeyOptions({
      userId: USER_ID,
      origin: ORIGIN,
      clientIP: CLIENT_IP,
    });
    if (!options.success) throw new Error("expected options success");
    const challengeEnvelope = options.data.challengeEnvelope;

    const result = await verifyExtensionPasskey({
      userId: USER_ID,
      origin: ORIGIN,
      challengeEnvelope,
      credential: {
        id: "cred-a",
        rawId: "raw-a",
        type: "public-key",
        response: {
          clientDataJSON: clientDataJSONForChallenge("different-challenge"),
          authenticatorData: "auth-data",
          signature: "sig",
        },
      },
      clientIP: CLIENT_IP,
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid passkey authentication payload",
    });
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it("rejects replay of the same challenge envelope", async () => {
    const options = await generateExtensionPasskeyOptions({
      userId: USER_ID,
      origin: ORIGIN,
      clientIP: CLIENT_IP,
    });
    if (!options.success) throw new Error("expected options success");
    const challengeEnvelope = options.data.challengeEnvelope;
    const clientDataJSON = clientDataJSONForChallenge(CHALLENGE);

    const credential = {
      id: "cred-a",
      rawId: "raw-a",
      type: "public-key" as const,
      response: {
        clientDataJSON,
        authenticatorData: "auth-data",
        signature: "sig",
      },
    };

    mocks.lookupCredentialByCredentialId.mockResolvedValue({
      data: {
        credential_id: "cred-a",
        public_key: Buffer.from("public-key").toString("base64url"),
        counter: 1,
        transports: ["internal"],
        user_id: USER_ID,
        backed_up: false,
      },
      error: null,
    });
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 2 },
    });
    mocks.credentialUpdateMaybeSingle.mockResolvedValue({
      data: { credential_id: "cred-a" },
      error: null,
    });

    const first = await verifyExtensionPasskey({
      userId: USER_ID,
      origin: ORIGIN,
      challengeEnvelope,
      credential,
      clientIP: CLIENT_IP,
    });
    expect(first.success).toBe(true);

    const second = await verifyExtensionPasskey({
      userId: USER_ID,
      origin: ORIGIN,
      challengeEnvelope,
      credential,
      clientIP: CLIENT_IP,
    });
    expect(second.success).toBe(false);
    expect(mocks.verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
  });

  it("verifies with server-issued challenge and updates counter", async () => {
    const options = await generateExtensionPasskeyOptions({
      userId: USER_ID,
      origin: ORIGIN,
      clientIP: CLIENT_IP,
    });
    if (!options.success) throw new Error("expected options success");
    const challengeEnvelope = options.data.challengeEnvelope;
    const clientDataJSON = clientDataJSONForChallenge(CHALLENGE);

    const result = await verifyExtensionPasskey({
      userId: USER_ID,
      origin: ORIGIN,
      challengeEnvelope,
      credential: {
        id: "cred-a",
        rawId: "raw-a",
        type: "public-key",
        response: {
          clientDataJSON,
          authenticatorData: "auth-data",
          signature: "sig",
        },
      },
      clientIP: CLIENT_IP,
    });

    expect(result).toEqual({ success: true, data: { userId: USER_ID } });
    expect(challengeFromClientDataJSON(clientDataJSON)).toBe(CHALLENGE);
    expect(mocks.getExpectedOrigins).toHaveBeenCalledWith(
      "helvety.com",
      ORIGIN
    );
    expect(mocks.verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: CHALLENGE,
        expectedOrigin: ["https://helvety.com", ORIGIN],
      })
    );
  });
});
