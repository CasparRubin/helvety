import "server-only";

import {
  AUTH_ACTIONS,
  AUTH_REASONS,
  logAuthEvent,
} from "@helvety/shared/auth-logger";
import {
  signCookiePayload,
  verifySignedCookiePayload,
} from "@helvety/shared/cookie-signing";
import { logger } from "@helvety/shared/logger";
import {
  createScopedAdminQuery,
  lookupCredentialByCredentialId,
} from "@helvety/shared/supabase/admin";
import {
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { z } from "zod";

import { OriginUrlSchema } from "@/app/actions/auth-action-helpers";
import { getRpId, getExpectedOrigins } from "@/app/actions/auth-rp-config";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import { getUserFromBearerAuthHeader } from "./extension-auth-user";

import type {
  AuthenticatorTransportFuture,
  AuthenticationResponseJSON,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";

const CHALLENGE_EXPIRY_MS = 3 * 60 * 1000;

const ExtensionCeremonyOriginSchema = z.union([
  OriginUrlSchema,
  z
    .string()
    .regex(
      /^chrome-extension:\/\/[a-z0-9]{8,64}$/i,
      "Invalid extension origin"
    ),
]);

export const ExtensionPasskeyAuthResponseSchema = z.object({
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

/** WebAuthn assertion JSON accepted from the extension verify route (no PRF payload). */
export type ExtensionPasskeyAuthResponse = z.infer<
  typeof ExtensionPasskeyAuthResponseSchema
>;

const StoredChallengeSchema = z.object({
  challenge: z.string().min(1),
  userId: z.uuid().optional(),
  expectedUserId: z.uuid().optional(),
  expectedEmail: z.email().optional(),
  timestamp: z.number().int().nonnegative(),
  redirectUri: z.url().optional(),
  prfSalt: z.string().min(1).optional(),
});

/** Signed challenge cookie payload for extension passkey ceremonies. */
type StoredChallenge = z.infer<typeof StoredChallengeSchema>;

const authenticatorTransportValues = new Set<AuthenticatorTransportFuture>([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

/** Maps stored DB transport strings to WebAuthn transport literals. */
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

const PasskeyCredentialIdSchema = z.object({
  id: z.string().min(1),
});

/** True if `origin` is in the RP allowlist (web + configured extension origins). */
function assertOriginAllowed(origin: string, rpId: string): boolean {
  const allowed = new Set(getExpectedOrigins(rpId));
  return allowed.has(origin);
}

/**
 * Build WebAuthn authentication options for an already Supabase-authenticated
 * user (Bearer session). Returns a signed challenge envelope for the client
 * to post back to `/api/extension/passkey/verify` (no HttpOnly cookie).
 */
export async function buildExtensionPasskeyAuthenticationOptions(input: {
  request: Request;
  clientIP: string | null;
  origin: string;
  isMobile: boolean;
}): Promise<
  | {
      ok: true;
      optionsJSON: Awaited<ReturnType<typeof generateAuthOptions>> & {
        hints?: ("hybrid" | "security-key" | "client-device")[];
      };
      challengeEnvelope: string;
    }
  | { ok: false; error: string }
> {
  const { request, clientIP, origin, isMobile } = input;

  if (!clientIP) {
    return { ok: false, error: "Unable to process request. Please try again." };
  }

  const authUser = await getUserFromBearerAuthHeader(request);
  if (!authUser) {
    return { ok: false, error: "Not authenticated" };
  }

  const originParse = ExtensionCeremonyOriginSchema.safeParse(origin);
  if (!originParse.success) {
    return {
      ok: false,
      error: "Unable to start passkey authentication. Please try again.",
    };
  }
  const safeOrigin = originParse.data;

  const rateLimit = await checkRateLimit(
    `passkey_ext:ip:${clientIP}`,
    RATE_LIMITS.PASSKEY.maxRequests,
    RATE_LIMITS.PASSKEY.windowMs,
    "passkey"
  );
  if (!rateLimit.allowed) {
    logAuthEvent("rate_limit_exceeded", {
      metadata: {
        action: AUTH_ACTIONS.generatePasskeyAuthOptions,
        retryAfter: rateLimit.retryAfter,
      },
      ip: clientIP,
    });
    return {
      ok: false,
      error: "Too many passkey attempts. Please wait and try again.",
    };
  }

  const rpId = getRpId(safeOrigin);
  if (!assertOriginAllowed(safeOrigin, rpId)) {
    return {
      ok: false,
      error: "This client origin is not allowed for passkeys.",
    };
  }

  const scopedAdmin = createScopedAdminQuery(authUser.user.id);
  const { data: credentials, error: credentialsError } = await scopedAdmin
    .from("user_auth_credentials")
    .select("credential_id, transports");

  if (credentialsError || !credentials?.length) {
    return {
      ok: false,
      error:
        "Unable to start passkey authentication. Please try signing in with email.",
    };
  }

  const allowCredentials = credentials.map(
    (item: { credential_id: string; transports: string[] | null }) => ({
      id: item.credential_id,
      transports: toAuthenticatorTransports(item.transports),
    })
  );

  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: rpId,
    userVerification: "required",
    timeout: 60_000,
    allowCredentials,
  };

  const authOpts = await generateAuthOptions(opts);

  const optionsWithHints = {
    ...authOpts,
    hints: (isMobile ? ["client-device"] : ["hybrid"]) as (
      | "hybrid"
      | "security-key"
      | "client-device"
    )[],
  };

  const challengeData: StoredChallenge = {
    challenge: authOpts.challenge,
    expectedUserId: authUser.user.id,
    timestamp: Date.now(),
  };

  const challengeEnvelope = await signCookiePayload(
    JSON.stringify(challengeData)
  );

  logAuthEvent("passkey_auth_started", {
    userId: authUser.user.id,
    ip: clientIP,
  });

  return {
    ok: true,
    optionsJSON: optionsWithHints,
    challengeEnvelope,
  };
}

/**
 * Verify a passkey assertion for an extension ceremony. Does not mint a new
 * Supabase cookie session (the caller already holds Bearer tokens).
 */
export async function verifyExtensionPasskeyAuthentication(input: {
  request: Request;
  clientIP: string | null;
  origin: string;
  challengeEnvelope: string;
  credential: ExtensionPasskeyAuthResponse;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const { request, clientIP, origin, challengeEnvelope, credential } = input;

  if (!clientIP) {
    return { ok: false, error: "Unable to process request. Please try again." };
  }

  const authUser = await getUserFromBearerAuthHeader(request);
  if (!authUser) {
    return { ok: false, error: "Not authenticated" };
  }

  const originParse = ExtensionCeremonyOriginSchema.safeParse(origin);
  if (!originParse.success) {
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }
  const safeOrigin = originParse.data;

  const rateLimit = await checkRateLimit(
    `passkey_ext_verify:ip:${clientIP}`,
    RATE_LIMITS.PASSKEY.maxRequests,
    RATE_LIMITS.PASSKEY.windowMs,
    "passkey"
  );
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: "Too many passkey attempts. Please wait and try again.",
    };
  }

  const rpId = getRpId(safeOrigin);
  if (!assertOriginAllowed(safeOrigin, rpId)) {
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }

  const unsignedPayload = await verifySignedCookiePayload(challengeEnvelope);
  if (!unsignedPayload) {
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }

  let storedData: StoredChallenge;
  try {
    const parsedJson = JSON.parse(unsignedPayload);
    const parsed = StoredChallengeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }
    storedData = parsed.data;
  } catch {
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }

  if (Date.now() - storedData.timestamp > CHALLENGE_EXPIRY_MS) {
    logAuthEvent("passkey_auth_failed", {
      userId: authUser.user.id,
      metadata: { reason: AUTH_REASONS.challengeExpired },
      ip: clientIP,
    });
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }

  if (
    storedData.expectedUserId &&
    storedData.expectedUserId !== authUser.user.id
  ) {
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }

  const idParseResult = PasskeyCredentialIdSchema.safeParse(credential);
  if (!idParseResult.success) {
    return { ok: false, error: "Invalid passkey authentication payload" };
  }
  const credentialId = idParseResult.data.id;

  try {
    const { data: credentialData, error: credError } =
      await lookupCredentialByCredentialId(credentialId);

    if (credError || !credentialData) {
      logger.logUnexpectedError("Credential not found", credError);
      logAuthEvent("passkey_auth_failed", {
        userId: authUser.user.id,
        metadata: { reason: AUTH_REASONS.credentialNotFound },
        ip: clientIP,
      });
      return {
        ok: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    const credRow = {
      ...credentialData,
      backed_up: credentialData.backed_up ?? false,
      transports: credentialData.transports ?? [],
    };

    if (credRow.user_id !== authUser.user.id) {
      logAuthEvent("passkey_auth_failed", {
        userId: authUser.user.id,
        metadata: { reason: AUTH_REASONS.credentialOwnerMismatch },
        ip: clientIP,
      });
      return { ok: false, error: "PASSKEY_ACCOUNT_MISMATCH" };
    }

    const publicKeyUint8 = new Uint8Array(
      Buffer.from(credRow.public_key, "base64url")
    );

    const parseResult =
      ExtensionPasskeyAuthResponseSchema.safeParse(credential);
    if (!parseResult.success) {
      return { ok: false, error: "Invalid passkey authentication payload" };
    }

    const typedResponse: AuthenticationResponseJSON = {
      id: parseResult.data.id,
      rawId: parseResult.data.rawId,
      type: parseResult.data.type,
      response: {
        ...parseResult.data.response,
        userHandle: parseResult.data.response.userHandle ?? undefined,
      },
      clientExtensionResults: {},
    };

    const opts: VerifyAuthenticationResponseOpts = {
      response: typedResponse,
      expectedChallenge: storedData.challenge,
      expectedOrigin: getExpectedOrigins(rpId),
      expectedRPID: rpId,
      credential: {
        id: credRow.credential_id,
        publicKey: publicKeyUint8,
        counter: credRow.counter,
        transports: toAuthenticatorTransports(credRow.transports),
      },
      requireUserVerification: true,
    };

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      logger.logUnexpectedError("Authentication verification failed", error);
      logAuthEvent("passkey_auth_failed", {
        userId: credRow.user_id,
        metadata: { reason: AUTH_REASONS.verificationError },
        ip: clientIP,
      });
      return {
        ok: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    if (!verification.verified) {
      logAuthEvent("passkey_auth_failed", {
        userId: credRow.user_id,
        metadata: { reason: AUTH_REASONS.verificationFailed },
        ip: clientIP,
      });
      return {
        ok: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    const scopedAdmin = createScopedAdminQuery(credRow.user_id);
    const { data: updatedCredential, error: updateError } = await scopedAdmin
      .from("user_auth_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("credential_id", credentialId)
      .eq("counter", credRow.counter)
      .select("credential_id")
      .maybeSingle();

    if (updateError || !updatedCredential) {
      logger.logUnexpectedError(
        "Error updating counter (or concurrent counter change) - failing auth for security",
        updateError
      );
      return {
        ok: false,
        error: "Passkey authentication failed. Please try again.",
      };
    }

    logAuthEvent("passkey_auth_success", {
      userId: credRow.user_id,
      ip: clientIP,
    });

    return { ok: true, userId: credRow.user_id };
  } catch (error) {
    logger.logUnexpectedError("Error verifying extension passkey", error);
    logAuthEvent("passkey_auth_failed", {
      metadata: { reason: AUTH_REASONS.unexpectedError },
      ip: clientIP,
    });
    return {
      ok: false,
      error: "Passkey authentication failed. Please try again.",
    };
  }
}
