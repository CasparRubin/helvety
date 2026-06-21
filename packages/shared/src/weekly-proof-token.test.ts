import { describe, expect, it } from "vitest";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";
import {
  EXTENSION_WEEKLY_PROOF_HEADER,
  EXTENSION_WEEKLY_PROOF_STORAGE_KEY,
  isWeeklyProofTokenPlausibleForUser,
} from "./weekly-proof-token";

describe("weekly-proof-token", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const nowSeconds = 1_700_000_000;

  it("exports shared header and storage key", () => {
    expect(EXTENSION_WEEKLY_PROOF_HEADER).toBe("X-Helvety-Weekly-Proof");
    expect(EXTENSION_WEEKLY_PROOF_STORAGE_KEY).toBe(
      "helvety_extension_weekly_proof"
    );
  });

  it("accepts structurally valid unexpired tokens for the signed-in user", () => {
    const payload = {
      v: 1 as const,
      userId,
      iat: nowSeconds,
      exp: nowSeconds + AUTH_MAX_LIFETIME_SECONDS,
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );
    const token = `${payloadPart}.fake-signature`;

    expect(isWeeklyProofTokenPlausibleForUser(token, userId, nowSeconds)).toBe(
      true
    );
  });

  it("rejects expired payload", () => {
    const payload = {
      v: 1 as const,
      userId,
      iat: nowSeconds - AUTH_MAX_LIFETIME_SECONDS - 10,
      exp: nowSeconds - 1,
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );
    const token = `${payloadPart}.fake-signature`;
    expect(isWeeklyProofTokenPlausibleForUser(token, userId, nowSeconds)).toBe(
      false
    );
  });

  it("rejects payload for a different user", () => {
    const payload = {
      v: 1 as const,
      userId: "22222222-2222-4222-8222-222222222222",
      iat: nowSeconds,
      exp: nowSeconds + AUTH_MAX_LIFETIME_SECONDS,
    };
    const payloadPart = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );
    const token = `${payloadPart}.fake-signature`;
    expect(isWeeklyProofTokenPlausibleForUser(token, userId, nowSeconds)).toBe(
      false
    );
  });

  it("rejects malformed tokens", () => {
    expect(isWeeklyProofTokenPlausibleForUser("not-a-token", userId)).toBe(
      false
    );
    expect(isWeeklyProofTokenPlausibleForUser("only-one-part", userId)).toBe(
      false
    );
  });
});
