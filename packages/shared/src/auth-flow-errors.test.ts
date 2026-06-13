import { describe, expect, it } from "vitest";

import {
  isRateLimitedAuthMessage,
  mapPasskeyWebAuthnError,
  rateLimitedAuthUserMessage,
  resolveRateLimitedAuthError,
} from "./auth-flow-errors";

describe("auth-flow-errors", () => {
  it("detects rate-limited auth messages", () => {
    expect(isRateLimitedAuthMessage("Too many requests")).toBe(true);
    expect(isRateLimitedAuthMessage("Request rate limit reached")).toBe(true);
    expect(isRateLimitedAuthMessage("HTTP 429")).toBe(true);
    expect(isRateLimitedAuthMessage("Invalid code")).toBe(false);
  });

  it("maps WebAuthn cancel and timeout", () => {
    const cancelled = new Error("cancelled");
    cancelled.name = "NotAllowedError";
    expect(mapPasskeyWebAuthnError(cancelled)).toEqual({
      message: "Authentication was canceled",
      errorName: "NotAllowedError",
    });
    const timeout = new Error("timeout");
    timeout.name = "AbortError";
    expect(mapPasskeyWebAuthnError(timeout)).toEqual({
      message: "Authentication timed out",
      errorName: "AbortError",
    });
  });

  it("exposes stable rate-limit user copy", () => {
    expect(rateLimitedAuthUserMessage()).toContain("rate-limited");
  });

  it("resolveRateLimitedAuthError maps rate limits and passes through other errors", () => {
    expect(resolveRateLimitedAuthError("HTTP 429")).toContain("rate-limited");
    expect(resolveRateLimitedAuthError("Invalid code")).toBe("Invalid code");
  });
});
