import {
  signCookiePayload,
  verifySignedCookiePayload,
} from "@helvety/shared/cookie-signing";
import { z } from "zod";

/** Matches web login challenge cookie TTL (`auth-action-helpers`). */
export const EXTENSION_CHALLENGE_EXPIRY_MS = 3 * 60 * 1000;

const ExtensionChallengePayloadSchema = z.object({
  challenge: z.string().min(1),
  expectedUserId: z.string().uuid(),
  origin: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
});

export type ExtensionChallengePayload = z.infer<
  typeof ExtensionChallengePayloadSchema
>;

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
  payload: Omit<ExtensionChallengePayload, "timestamp">
): Promise<string> {
  const body: ExtensionChallengePayload = {
    ...payload,
    timestamp: Date.now(),
  };
  return signCookiePayload(JSON.stringify(body));
}

/**
 * Validates a challenge envelope from the matching options call.
 * Returns the server-issued challenge when signature, TTL, user, and origin match.
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
  if (Date.now() - data.timestamp > EXTENSION_CHALLENGE_EXPIRY_MS) {
    return null;
  }

  if (
    data.expectedUserId !== expected.userId ||
    data.origin !== expected.origin
  ) {
    return null;
  }

  return { challenge: data.challenge };
}
