import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_MAX_LIFETIME_SECONDS } from "./auth-session-policy";
import {
  mintExtensionWeeklyProof,
  verifyExtensionWeeklyProof,
} from "./extension-weekly-proof-server";

const DEVICE_TRUST_SECRET = "dev_secret_".padEnd(40, "s");
const TRUSTED_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("extension-weekly-proof-server", () => {
  beforeEach(() => {
    process.env.DEVICE_TRUST_COOKIE_SECRET = DEVICE_TRUST_SECRET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mints and verifies a weekly proof for the same user", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const token = mintExtensionWeeklyProof(TRUSTED_USER_ID);
    const payload = verifyExtensionWeeklyProof(token, TRUSTED_USER_ID);

    expect(payload).toEqual(
      expect.objectContaining({
        v: 1,
        userId: TRUSTED_USER_ID,
      })
    );
  });

  it("rejects weekly proof for a different user", () => {
    const token = mintExtensionWeeklyProof(TRUSTED_USER_ID);
    expect(verifyExtensionWeeklyProof(token, OTHER_USER_ID)).toBeNull();
  });

  it("rejects expired weekly proof tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const token = mintExtensionWeeklyProof(TRUSTED_USER_ID);
    vi.advanceTimersByTime((AUTH_MAX_LIFETIME_SECONDS + 61) * 1000);

    expect(verifyExtensionWeeklyProof(token, TRUSTED_USER_ID)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(
      verifyExtensionWeeklyProof("not-a-valid-token", TRUSTED_USER_ID)
    ).toBeNull();
    expect(
      verifyExtensionWeeklyProof("only-one-part", TRUSTED_USER_ID)
    ).toBeNull();
  });

  it("rejects tampered HMAC signatures", () => {
    const token = mintExtensionWeeklyProof(TRUSTED_USER_ID);
    const [, signature] = token.split(".");
    const tamperedSignature =
      signature?.slice(0, -1) + (signature?.endsWith("a") ? "b" : "a");
    const tampered = `${token.split(".")[0]}.${tamperedSignature}`;

    expect(verifyExtensionWeeklyProof(tampered, TRUSTED_USER_ID)).toBeNull();
  });

  it("returns null when the signing secret is missing", () => {
    const token = mintExtensionWeeklyProof(TRUSTED_USER_ID);
    delete process.env.DEVICE_TRUST_COOKIE_SECRET;

    expect(verifyExtensionWeeklyProof(token, TRUSTED_USER_ID)).toBeNull();
  });
});
