import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  challengeFromClientDataJSON,
  createExtensionChallengeEnvelope,
  EXTENSION_CHALLENGE_EXPIRY_MS,
  verifyExtensionChallengeEnvelope,
} from "./extension-passkey-challenge";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

describe("extension-passkey-challenge", () => {
  beforeEach(() => {
    process.env.HELVETY_COOKIE_SIGNING_SECRET = "test-signing-secret-32chars-min";
  });

  afterEach(() => {
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
  });

  it("extracts challenge from base64url clientDataJSON", () => {
    const challenge = "test-challenge-base64url";
    const clientDataJSON = Buffer.from(
      JSON.stringify({ type: "webauthn.get", challenge, origin: ORIGIN }),
      "utf8"
    ).toString("base64url");

    expect(challengeFromClientDataJSON(clientDataJSON)).toBe(challenge);
  });

  it("round-trips a signed envelope for the same user and origin", async () => {
    const challenge = "server-issued-challenge";
    const envelope = await createExtensionChallengeEnvelope({
      challenge,
      expectedUserId: USER_ID,
      origin: ORIGIN,
    });

    const verified = await verifyExtensionChallengeEnvelope(envelope, {
      userId: USER_ID,
      origin: ORIGIN,
    });
    expect(verified).toEqual({ challenge });
  });

  it("rejects tampered envelopes", async () => {
    const envelope = await createExtensionChallengeEnvelope({
      challenge: "abc",
      expectedUserId: USER_ID,
      origin: ORIGIN,
    });

    const verified = await verifyExtensionChallengeEnvelope(
      `${envelope}tampered`,
      { userId: USER_ID, origin: ORIGIN }
    );
    expect(verified).toBeNull();
  });

  it("rejects envelopes for a different user or origin", async () => {
    const envelope = await createExtensionChallengeEnvelope({
      challenge: "abc",
      expectedUserId: USER_ID,
      origin: ORIGIN,
    });

    expect(
      await verifyExtensionChallengeEnvelope(envelope, {
        userId: "00000000-0000-4000-8000-000000000002",
        origin: ORIGIN,
      })
    ).toBeNull();
    expect(
      await verifyExtensionChallengeEnvelope(envelope, {
        userId: USER_ID,
        origin: "chrome-extension://other-extension-id-here000000",
      })
    ).toBeNull();
  });

  it("rejects expired envelopes", async () => {
    const envelope = await createExtensionChallengeEnvelope({
      challenge: "abc",
      expectedUserId: USER_ID,
      origin: ORIGIN,
    });

    const realNow = Date.now;
    Date.now = () => realNow() + EXTENSION_CHALLENGE_EXPIRY_MS + 1;

    try {
      expect(
        await verifyExtensionChallengeEnvelope(envelope, {
          userId: USER_ID,
          origin: ORIGIN,
        })
      ).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });
});
