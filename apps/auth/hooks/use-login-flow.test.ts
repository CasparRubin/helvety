import { describe, expect, it } from "vitest";

import { resolveLoginEntryStep } from "@/lib/login-entry";

import {
  isRateLimitedLoginAuthSession,
  shouldResetLoginAuthSession,
  withLoginAuthProbeTimeout,
} from "./use-login-flow";

const TRUSTED_USER = "550e8400-e29b-41d4-a716-446655440000";

describe("use-login-flow auth bootstrap guards", () => {
  it("detects terminal refresh/session errors", () => {
    expect(shouldResetLoginAuthSession("Invalid refresh token")).toBe(true);
    expect(
      shouldResetLoginAuthSession("POST /auth/v1/token returned 429")
    ).toBe(false);
    expect(
      shouldResetLoginAuthSession("Auth API error: too many requests")
    ).toBe(false);
    expect(shouldResetLoginAuthSession("network timeout")).toBe(false);
    expect(shouldResetLoginAuthSession(null)).toBe(false);
  });

  it("detects auth probe rate-limit errors separately", () => {
    expect(
      isRateLimitedLoginAuthSession("POST /auth/v1/token returned 429")
    ).toBe(true);
    expect(
      isRateLimitedLoginAuthSession("Auth API error: too many requests")
    ).toBe(true);
    expect(
      isRateLimitedLoginAuthSession("AuthApiError: Request rate limit reached")
    ).toBe(true);
    expect(isRateLimitedLoginAuthSession("Invalid refresh token")).toBe(false);
    expect(isRateLimitedLoginAuthSession(null)).toBe(false);
  });

  it("times out slow auth probes", async () => {
    const neverSettles = new Promise<never>(() => undefined);
    await expect(
      withLoginAuthProbeTimeout(neverSettles, 5)
    ).rejects.toThrowError("AUTH_PROBE_TIMEOUT");
  });

  it("resolves fast auth probes normally", async () => {
    await expect(
      withLoginAuthProbeTimeout(Promise.resolve("ok"), 100)
    ).resolves.toBe("ok");
  });
});

describe("use-login-flow bootstrap alignment", () => {
  it("bare /auth/login with trust lands on passkey-signin (not email)", () => {
    expect(
      resolveLoginEntryStep({
        urlStep: null,
        hasSession: false,
        trust: { trusted: true, userId: TRUSTED_USER },
        forceLogin: false,
        requiredAuthStep: null,
        redirectUri: "https://helvety.com/tasks",
      })
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: TRUSTED_USER,
    });
  });

  it("force_login with trust still skips email before passkey", () => {
    expect(
      resolveLoginEntryStep({
        urlStep: null,
        hasSession: false,
        trust: { trusted: true, userId: TRUSTED_USER },
        forceLogin: true,
        requiredAuthStep: null,
        redirectUri: "https://helvety.com/tasks",
      })
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: TRUSTED_USER,
    });
  });
});
