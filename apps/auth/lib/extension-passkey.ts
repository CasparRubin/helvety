import "server-only";

import { AUTH_REASONS, logAuthEvent } from "@helvety/shared/auth-logger";
import { logger } from "@helvety/shared/logger";
import { checkRateLimit } from "@helvety/shared/rate-limit";
import {
  createScopedAdminQuery,
  lookupCredentialByCredentialId,
} from "@helvety/shared/supabase/admin";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import {
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { z } from "zod";

import { getRpId, getExpectedOrigins } from "@/app/actions/auth-rp-config";
import { isAllowedChromeExtensionOrigin } from "@/lib/chrome-extension-origin";
import {
  challengeFromClientDataJSON,
  createExtensionChallengeEnvelope,
  verifyExtensionChallengeEnvelope,
} from "@/lib/extension-passkey-challenge";
import { RATE_LIMITS, resetRateLimit } from "@/lib/rate-limit";

import type {
  ActionResponse,
  UserAuthCredential,
} from "@helvety/shared/types/entities";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  GenerateAuthenticationOptionsOpts,
  PublicKeyCredentialRequestOptionsJSON,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";

const ExtensionOriginSchema = z
  .string()
  .min(1)
  .refine((value) => {
    if (value.startsWith("chrome-extension://")) {
      return isAllowedChromeExtensionOrigin(value);
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:") return true;
      return (
        parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
      );
    } catch {
      return false;
    }
  }, "Invalid or disallowed origin URL");

const ExtensionPasskeyOptionsBodySchema = z.object({
  origin: ExtensionOriginSchema,
  isMobile: z.boolean().optional(),
  expectedUserId: z.string().uuid(),
});

const ExtensionPasskeyCredentialSchema = z.object({
  id: z.string().min(1),
  rawId: z.string().min(1),
  type: z.literal("public-key"),
  response: z.object({
    clientDataJSON: z.string().min(1),
    authenticatorData: z.string().min(1),
    signature: z.string().min(1),
    userHandle: z.string().nullable().optional(),
  }),
});

const ExtensionPasskeyVerifyBodySchema = z.object({
  origin: ExtensionOriginSchema,
  credential: ExtensionPasskeyCredentialSchema,
  challengeEnvelope: z.string().min(1),
});

/** Options + signed challenge for extension unlock (Bearer session). */
export type ExtensionPasskeyOptionsPayload = {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeEnvelope: string;
};

const authenticatorTransportValues = new Set<AuthenticatorTransportFuture>([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

/**
 *
 */
function toAuthenticatorTransports(
  transports: string[] | null | undefined
): AuthenticatorTransportFuture[] {
  return (transports ?? []).filter(
    (transport): transport is AuthenticatorTransportFuture =>
      authenticatorTransportValues.has(
        transport as AuthenticatorTransportFuture
      )
  );
}

/**
 *
 */
async function checkPasskeyRateLimit(
  key: string,
  clientIP: string | null
): Promise<{ success: false; error: string } | null> {
  if (!clientIP) {
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }
  const rate = await checkRateLimit(
    key,
    RATE_LIMITS.PASSKEY.maxRequests,
    RATE_LIMITS.PASSKEY.windowMs
  );
  if (!rate.allowed) {
    const retryAfter = rate.retryAfter ?? 60;
    logAuthEvent("rate_limit_exceeded", {
      metadata: { action: key, retryAfter },
      ip: clientIP,
    });
    return {
      success: false,
      error: buildRateLimitedUserMessage(retryAfter),
    };
  }
  return null;
}

/** Validates extension/WebAuthn caller origin (allowlisted chrome-extension or dev https). */
function parseExtensionOrigin(
  origin: string
): { ok: true; origin: string } | { ok: false; error: string } {
  const parsed = ExtensionOriginSchema.safeParse(origin);
  if (!parsed.success) {
    return { ok: false, error: "Invalid or disallowed origin URL" };
  }
  return { ok: true, origin: parsed.data };
}

/**
 * WebAuthn authentication options for the Chromium extension (Bearer session).
 * Returns flat `PublicKeyCredentialRequestOptionsJSON` including `challenge` for
 * `startAuthentication` — no httpOnly challenge cookie.
 */
export async function generateExtensionPasskeyOptions(input: {
  userId: string;
  origin: string;
  isMobile?: boolean;
  clientIP: string | null;
}): Promise<ActionResponse<ExtensionPasskeyOptionsPayload>> {
  const rateLimited = await checkPasskeyRateLimit(
    `passkey_auth:ip:${input.clientIP ?? "unknown"}`,
    input.clientIP
  );
  if (rateLimited) return rateLimited;

  const originResult = parseExtensionOrigin(input.origin);
  if (!originResult.ok) {
    return { success: false, error: originResult.error };
  }

  const isMobile = input.isMobile === true;
  const safeOrigin = originResult.origin;
  const rpId = getRpId(safeOrigin);

  try {
    const scopedAdmin = createScopedAdminQuery(input.userId);
    const { data: credentials, error: credentialsError } = await scopedAdmin
      .from("user_auth_credentials")
      .select("credential_id, transports");

    if (credentialsError || !credentials || credentials.length === 0) {
      return {
        success: false,
        error: "No passkey is registered for this account.",
      };
    }

    const allowCredentials: GenerateAuthenticationOptionsOpts["allowCredentials"] =
      credentials.map(
        (item: { credential_id: string; transports: string[] | null }) => ({
          id: item.credential_id,
          transports: toAuthenticatorTransports(item.transports),
        })
      );

    const authOpts = await generateAuthOptions({
      rpID: rpId,
      userVerification: "required",
      timeout: 60_000,
      allowCredentials,
    });

    const optionsWithHints: PublicKeyCredentialRequestOptionsJSON = {
      ...authOpts,
      hints: isMobile ? ["client-device"] : ["hybrid"],
    };

    if (input.clientIP) {
      await resetRateLimit(`passkey_auth:ip:${input.clientIP}`);
    }

    const challengeEnvelope = await createExtensionChallengeEnvelope({
      challenge: authOpts.challenge,
      expectedUserId: input.userId,
      origin: safeOrigin,
    });

    logAuthEvent("passkey_auth_started", {
      userId: input.userId,
      ip: input.clientIP ?? undefined,
      metadata: { channel: "extension" },
    });

    return {
      success: true,
      data: { options: optionsWithHints, challengeEnvelope },
    };
  } catch (error) {
    logger.logUnexpectedError("Extension passkey options failed", error);
    return {
      success: false,
      error: "Unable to start passkey authentication. Please try again.",
    };
  }
}

/**
 * Verifies a passkey assertion from the extension. Does not create a Supabase
 * cookie session — the extension already holds the OTP JWT.
 */
export async function verifyExtensionPasskey(input: {
  userId: string;
  origin: string;
  credential: z.infer<typeof ExtensionPasskeyCredentialSchema>;
  challengeEnvelope: string;
  clientIP: string | null;
}): Promise<ActionResponse<{ userId: string }>> {
  const rateLimited = await checkPasskeyRateLimit(
    `passkey_verify:ip:${input.clientIP ?? "unknown"}`,
    input.clientIP
  );
  if (rateLimited) return rateLimited;

  const originResult = parseExtensionOrigin(input.origin);
  if (!originResult.ok) {
    return { success: false, error: originResult.error };
  }

  const safeOrigin = originResult.origin;
  const rpId = getRpId(safeOrigin);
  const expectedOrigins = getExpectedOrigins(rpId, safeOrigin);
  const credentialId = input.credential.id;

  try {
    const storedChallenge = await verifyExtensionChallengeEnvelope(
      input.challengeEnvelope,
      { userId: input.userId, origin: safeOrigin }
    );
    if (!storedChallenge) {
      logAuthEvent("passkey_auth_failed", {
        userId: input.userId,
        metadata: {
          reason: AUTH_REASONS.challengeExpired,
          channel: "extension",
        },
        ip: input.clientIP ?? undefined,
      });
      return {
        success: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    let challengeFromAssertion: string;
    try {
      challengeFromAssertion = challengeFromClientDataJSON(
        input.credential.response.clientDataJSON
      );
    } catch {
      return {
        success: false,
        error: "Invalid passkey authentication payload",
      };
    }

    if (challengeFromAssertion !== storedChallenge.challenge) {
      logAuthEvent("passkey_auth_failed", {
        userId: input.userId,
        metadata: {
          reason: AUTH_REASONS.verificationFailed,
          channel: "extension",
        },
        ip: input.clientIP ?? undefined,
      });
      return {
        success: false,
        error: "Invalid passkey authentication payload",
      };
    }

    const expectedChallenge = storedChallenge.challenge;

    const { data: credentialData, error: credError } =
      await lookupCredentialByCredentialId(credentialId);

    if (credError || !credentialData) {
      logAuthEvent("passkey_auth_failed", {
        userId: input.userId,
        metadata: {
          reason: AUTH_REASONS.credentialNotFound,
          channel: "extension",
        },
        ip: input.clientIP ?? undefined,
      });
      return {
        success: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    if (credentialData.user_id !== input.userId) {
      logAuthEvent("passkey_auth_failed", {
        userId: credentialData.user_id,
        metadata: {
          reason: AUTH_REASONS.credentialOwnerMismatch,
          channel: "extension",
        },
        ip: input.clientIP ?? undefined,
      });
      return { success: false, error: "PASSKEY_ACCOUNT_MISMATCH" };
    }

    const credential: UserAuthCredential = {
      ...credentialData,
      backed_up: credentialData.backed_up ?? false,
      transports: credentialData.transports ?? [],
    };

    const publicKeyUint8 = new Uint8Array(
      Buffer.from(credential.public_key, "base64url")
    );

    const typedResponse: AuthenticationResponseJSON = {
      id: input.credential.id,
      rawId: input.credential.rawId,
      type: input.credential.type,
      response: {
        ...input.credential.response,
        userHandle: input.credential.response.userHandle ?? undefined,
      },
      clientExtensionResults: {},
    };

    const opts: VerifyAuthenticationResponseOpts = {
      response: typedResponse,
      expectedChallenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyUint8,
        counter: credential.counter,
        transports: toAuthenticatorTransports(credential.transports),
      },
      requireUserVerification: true,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (!verification.verified) {
      logAuthEvent("passkey_auth_failed", {
        userId: input.userId,
        metadata: {
          reason: AUTH_REASONS.verificationFailed,
          channel: "extension",
        },
        ip: input.clientIP ?? undefined,
      });
      return {
        success: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    const scopedAdmin = createScopedAdminQuery(credential.user_id);
    const { data: updatedCredential, error: updateError } = await scopedAdmin
      .from("user_auth_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", credentialId)
      .eq("counter", credential.counter)
      .select("credential_id")
      .maybeSingle();

    if (updateError || !updatedCredential) {
      logger.logUnexpectedError(
        "Extension passkey counter update failed",
        updateError
      );
      return {
        success: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    if (input.clientIP) {
      await Promise.all([
        resetRateLimit(`passkey_auth:ip:${input.clientIP}`),
        resetRateLimit(`passkey_verify:ip:${input.clientIP}`),
      ]);
    }

    logAuthEvent("passkey_auth_success", {
      userId: credential.user_id,
      ip: input.clientIP ?? undefined,
      metadata: { channel: "extension" },
    });

    return { success: true, data: { userId: credential.user_id } };
  } catch (error) {
    logger.logUnexpectedError("Extension passkey verify failed", error);
    logAuthEvent("passkey_auth_failed", {
      userId: input.userId,
      metadata: { reason: AUTH_REASONS.unexpectedError, channel: "extension" },
      ip: input.clientIP ?? undefined,
    });
    return {
      success: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }
}

export { ExtensionPasskeyOptionsBodySchema, ExtensionPasskeyVerifyBodySchema };
