import { randomUUID } from "node:crypto";

import {
  signCookiePayload,
  verifySignedCookiePayload,
} from "@helvety/shared/cookie-signing";
import { consumeSingleUseKey } from "@helvety/shared/rate-limit";
import { z } from "zod";

import { WEBAUTHN_CHALLENGE_EXPIRY_MS } from "@/lib/webauthn-challenge-ttl";

/** Matches web login challenge cookie TTL (`auth-action-helpers`). */
export const EXTENSION_CHALLENGE_EXPIRY_MS = WEBAUTHN_CHALLENGE_EXPIRY_MS;

const ExtensionChallengePayloadSchema = z.object({
  challenge: z.string().min(1),
  expectedUserId: z.string().uuid(),
  origin: z.string().min(1),
  nonce: z.string().uuid(),
  timestamp: z.number().int().nonnegative(),
});

/** Parsed payload inside a signed extension passkey challenge envelope. */
export type ExtensionChallengePayload = z.infer<
  typeof ExtensionChallengePayloadSchema
>;

/** Upstash key for one-time consumption of an extension challenge `nonce`. */
function buildExtensionChallengeSingleUseKey(nonce: string): string {
  return `passkey:extension-challenge:${nonce}`;
}

/** Reads the WebAuthn challenge from base64url `clientDataJSON`. */
export function challengeFromClientDataJSON(clientDataJSON: string): string {
  const parsed = JSON.parse(
    Buffer.from(clientDataJSON, "base64url").toString("utf8")
  ) as { challenge?: unknown };
  if (typeof parsed.challenge !== "string" || !parsed.challenge) {
    throw new Error("MISSING_CHALLENGE");
  }
  return parsed.challenge;
}

/** Signed challenge binding for extension verify (no httpOnly cookie). */
export async function createExtensionChallengeEnvelope(
  payload: Omit<ExtensionChallengePayload, "timestamp" | "nonce">
): Promise<string> {
  const body: ExtensionChallengePayload = {
    ...payload,
    nonce: randomUUID(),
    timestamp: Date.now(),
  };
  return signCookiePayload(JSON.stringify(body));
}

/**
 * Validates a challenge envelope from the matching options call.
 * Returns the server-issued challenge when signature, TTL, user, and origin match.
 * Each envelope is single-use within the TTL window.
 */
export async function verifyExtensionChallengeEnvelope(
  envelope: string,
  expected: { userId: string; origin: string }
): Promise<{ challenge: string } | null> {
  const unsigned = await verifySignedCookiePayload(envelope);
  if (!unsigned) {
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(unsigned);
  } catch {
    return null;
  }

  const parsed = ExtensionChallengePayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;
  const ageMs = Date.now() - data.timestamp;
  if (ageMs > EXTENSION_CHALLENGE_EXPIRY_MS) {
    return null;
  }

  if (
    data.expectedUserId !== expected.userId ||
    data.origin !== expected.origin
  ) {
    return null;
  }

  const remainingTtlMs = Math.max(EXTENSION_CHALLENGE_EXPIRY_MS - ageMs, 1);
  const consumed = await consumeSingleUseKey(
    buildExtensionChallengeSingleUseKey(data.nonce),
    remainingTtlMs,
    "strict"
  );
  if (!consumed) {
    return null;
  }

  return { challenge: data.challenge };
}
