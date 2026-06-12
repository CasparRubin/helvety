import { describe, expect, it } from "vitest";

import {
  expectsExistingSessionOnBootstrap,
  isRateLimitedAuthMessage,
  mapPasskeyRegistrationWebAuthnError,
  mapPasskeyWebAuthnError,
  resolveBootstrapFriendlyError,
  shouldSurfaceLoginError,
} from "./login-flow-errors";

describe("shouldSurfaceLoginError", () => {
  it("suppresses bootstrap errors after OTP success", () => {
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: true,
        step: "passkey-signin",
        source: "bootstrap",
      })
    ).toBe(false);
  });

  it("still surfaces OTP and email errors after OTP success", () => {
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: true,
        step: "verify-code",
        source: "otp",
      })
    ).toBe(true);
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: true,
        step: "email",
        source: "email",
      })
    ).toBe(true);
  });

  it("suppresses auto-passkey NotAllowedError and AbortError", () => {
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: false,
        step: "passkey-signin",
        source: "passkey",
        ceremonySource: "auto",
        webAuthnErrorName: "NotAllowedError",
      })
    ).toBe(false);
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: false,
        step: "passkey-signin",
        source: "passkey",
        ceremonySource: "auto",
        webAuthnErrorName: "AbortError",
      })
    ).toBe(false);
  });

  it("still surfaces auto-passkey non-dismiss WebAuthn failures", () => {
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: false,
        step: "passkey-signin",
        source: "passkey",
        ceremonySource: "auto",
        webAuthnErrorName: "SecurityError",
      })
    ).toBe(true);
  });

  it("surfaces user-initiated passkey cancel", () => {
    expect(
      shouldSurfaceLoginError({
        otpVerifySucceeded: false,
        step: "passkey-signin",
        source: "passkey",
        ceremonySource: "user",
        webAuthnErrorName: "NotAllowedError",
      })
    ).toBe(true);
  });
});

describe("expectsExistingSessionOnBootstrap", () => {
  it("is false for default email entry", () => {
    expect(
      expectsExistingSessionOnBootstrap({
        initialStep: "email",
        initialTrustedUserId: null,
        urlStep: null,
      })
    ).toBe(false);
  });

  it("is true when server passes initialError", () => {
    expect(
      expectsExistingSessionOnBootstrap({
        initialStep: "email",
        initialTrustedUserId: null,
        initialError: "Authentication failed. Please try again.",
        urlStep: null,
      })
    ).toBe(true);
  });

  it("is true for trusted-device passkey entry", () => {
    expect(
      expectsExistingSessionOnBootstrap({
        initialStep: "passkey-signin",
        initialTrustedUserId: "user-1",
        urlStep: "passkey-signin",
      })
    ).toBe(true);
  });

  it("is true for encryption-setup deep link without trust", () => {
    expect(
      expectsExistingSessionOnBootstrap({
        initialStep: "email",
        initialTrustedUserId: null,
        urlStep: "encryption-setup",
      })
    ).toBe(true);
  });
});

describe("isRateLimitedAuthMessage", () => {
  it("detects Supabase-style rate limit errors", () => {
    expect(isRateLimitedAuthMessage("Request rate limit reached")).toBe(true);
    expect(isRateLimitedAuthMessage("POST /auth/v1/token returned 429")).toBe(
      true
    );
    expect(isRateLimitedAuthMessage("Auth API error: too many requests")).toBe(
      true
    );
    expect(isRateLimitedAuthMessage("Invalid refresh token")).toBe(false);
    expect(isRateLimitedAuthMessage(null)).toBe(false);
  });
});

describe("resolveBootstrapFriendlyError", () => {
  it("returns null for probe timeout on fresh sign-in", () => {
    expect(
      resolveBootstrapFriendlyError("AUTH_PROBE_TIMEOUT", false)
    ).toBeNull();
  });

  it("returns restore message for probe timeout when session expected", () => {
    expect(resolveBootstrapFriendlyError("AUTH_PROBE_TIMEOUT", true)).toBe(
      "We could not restore your session in time. Please sign in."
    );
  });

  it("returns null for generic bootstrap failure on fresh sign-in", () => {
    expect(resolveBootstrapFriendlyError("network error", false)).toBeNull();
  });

  it("returns restore message for generic bootstrap failure when session expected", () => {
    expect(resolveBootstrapFriendlyError("network error", true)).toBe(
      "We could not restore your session. Please sign in."
    );
  });

  it("always surfaces rate-limit copy regardless of entry context", () => {
    const message =
      "Authentication is temporarily rate-limited. Please wait a few seconds and try again.";
    expect(resolveBootstrapFriendlyError("too many requests", false)).toBe(
      message
    );
    expect(resolveBootstrapFriendlyError("429", true)).toBe(message);
  });
});

describe("mapPasskeyWebAuthnError", () => {
  it("maps NotAllowedError to canceled copy", () => {
    const err = new Error("denied");
    err.name = "NotAllowedError";
    expect(mapPasskeyWebAuthnError(err).message).toBe(
      "Authentication was canceled"
    );
    expect(mapPasskeyWebAuthnError(err).errorName).toBe("NotAllowedError");
  });

  it("maps AbortError to timed out copy", () => {
    const err = new Error("timed out");
    err.name = "AbortError";
    expect(mapPasskeyWebAuthnError(err).message).toBe(
      "Authentication timed out"
    );
    expect(mapPasskeyWebAuthnError(err).errorName).toBe("AbortError");
  });

  it("returns generic copy for unknown errors", () => {
    expect(mapPasskeyWebAuthnError("not an error").message).toBe(
      "Failed to authenticate with passkey"
    );
  });
});

describe("mapPasskeyRegistrationWebAuthnError", () => {
  it("maps NotAllowedError to registration canceled copy", () => {
    const err = new Error("denied");
    err.name = "NotAllowedError";
    expect(mapPasskeyRegistrationWebAuthnError(err)).toBe(
      "Passkey creation was canceled. Please try again."
    );
  });

  it("falls back to error message or generic registration failure", () => {
    expect(mapPasskeyRegistrationWebAuthnError(new Error("custom"))).toBe(
      "custom"
    );
    expect(mapPasskeyRegistrationWebAuthnError(null)).toBe(
      "Passkey registration failed"
    );
  });
});
