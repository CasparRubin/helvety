import { describe, expect, it } from "vitest";

import {
  buildAuthHardLogoutError,
  buildAuthRequiredError,
  classifyActionAuthError,
  isAuthRequiredError,
  isRetryableAuthTransportError,
  normalizeActionError,
  shouldForceHardLogout,
} from "./auth-errors";

describe("auth-errors", () => {
  it("builds and normalizes AUTH_REQUIRED errors", () => {
    const error = buildAuthRequiredError("Session missing");

    expect(error).toBe("AUTH_REQUIRED:Session missing");
    expect(isAuthRequiredError(error)).toBe(true);
    expect(normalizeActionError(error)).toBe("Session missing");
    expect(classifyActionAuthError(error)).toBe("login");
  });

  it("classifies AUTH_HARD_LOGOUT errors", () => {
    const error = "AUTH_HARD_LOGOUT:Encryption state invalid";

    expect(error).toBe("AUTH_HARD_LOGOUT:Encryption state invalid");
    expect(normalizeActionError(error)).toBe("Encryption state invalid");
    expect(classifyActionAuthError(error)).toBe("hard_logout");
  });

  it("builds and round-trips AUTH_HARD_LOGOUT errors", () => {
    const error = buildAuthHardLogoutError("refresh token not found");

    expect(error).toBe("AUTH_HARD_LOGOUT:refresh token not found");
    expect(classifyActionAuthError(error)).toBe("hard_logout");
    expect(shouldForceHardLogout(error)).toBe(true);
    expect(normalizeActionError(error)).toBe("refresh token not found");
  });

  it("builds AUTH_HARD_LOGOUT with default message", () => {
    const error = buildAuthHardLogoutError();

    expect(error).toBe("AUTH_HARD_LOGOUT:Authentication state is invalid");
    expect(classifyActionAuthError(error)).toBe("hard_logout");
    expect(shouldForceHardLogout(error)).toBe(true);
  });

  it("classifies plain auth-required messages as login intent", () => {
    expect(classifyActionAuthError("Not authenticated")).toBe("login");
    expect(classifyActionAuthError("Unauthorized access")).toBe("login");
    expect(classifyActionAuthError("JWT expired")).toBe("login");
  });

  it("classifies only explicit terminal messages as hard logout", () => {
    expect(classifyActionAuthError("Invalid refresh token")).toBe(
      "hard_logout"
    );
    expect(classifyActionAuthError("Session has been revoked")).toBe(
      "hard_logout"
    );
    expect(classifyActionAuthError("AUTH_HARD_LOGOUT:forced")).toBe(
      "hard_logout"
    );
  });

  it("does not force hard logout for transient or local failures", () => {
    expect(classifyActionAuthError("Session temporarily unavailable")).toBe(
      "none"
    );
    expect(classifyActionAuthError("Token refresh in progress")).toBe("none");
    expect(classifyActionAuthError("Failed to check encryption status")).toBe(
      "none"
    );
    expect(classifyActionAuthError("Security validation failed")).toBe("none");
    expect(shouldForceHardLogout("Session temporarily unavailable")).toBe(
      false
    );
  });

  it("classifies retryable transport errors", () => {
    expect(
      isRetryableAuthTransportError({
        name: "AuthRetryableFetchError",
        message: "fetch failed",
      })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({
        name: "AbortError",
        message: "The operation was aborted",
      })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({
        message: "fetch failed",
        status: 0,
      })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({
        message: "upstream unavailable",
        status: 503,
      })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({
        message: "network timeout",
        status: 408,
      })
    ).toBe(true);
  });

  it("does not classify definitive auth failures as retryable transport errors", () => {
    expect(
      isRetryableAuthTransportError({
        message: "refresh token not found",
        status: 401,
      })
    ).toBe(false);
    expect(
      isRetryableAuthTransportError({
        message: "JWT expired",
        status: 401,
      })
    ).toBe(false);
    expect(
      isRetryableAuthTransportError({
        message: "Not authenticated",
        status: 403,
      })
    ).toBe(false);
    expect(
      isRetryableAuthTransportError({
        message: "Session has been revoked",
        status: 401,
      })
    ).toBe(false);
  });

  it("treats network 5xx as retryable even without a network message", () => {
    expect(
      isRetryableAuthTransportError({ message: "Bad gateway", status: 502 })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({ message: "Internal", status: 500 })
    ).toBe(true);
  });

  it("does not retry non-network 4xx without a transport message", () => {
    expect(
      isRetryableAuthTransportError({ message: "Conflict", status: 409 })
    ).toBe(false);
    expect(
      isRetryableAuthTransportError({ message: "Bad request", status: 400 })
    ).toBe(false);
  });

  it("matches connection-level message tokens", () => {
    expect(isRetryableAuthTransportError({ message: "fetch failed" })).toBe(
      true
    );
    expect(
      isRetryableAuthTransportError({ message: "ECONNREFUSED 127.0.0.1:5432" })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({ message: "Connection reset by peer" })
    ).toBe(true);
    expect(
      isRetryableAuthTransportError({ message: "The operation timed out" })
    ).toBe(true);
  });

  it("classifies DOMException AbortError as retryable", () => {
    expect(
      isRetryableAuthTransportError(
        new DOMException("The operation was aborted", "AbortError")
      )
    ).toBe(true);
  });

  it("returns false for nullish, empty, and non-object inputs", () => {
    expect(isRetryableAuthTransportError(null)).toBe(false);
    expect(isRetryableAuthTransportError(undefined)).toBe(false);
    expect(isRetryableAuthTransportError("")).toBe(false);
    expect(isRetryableAuthTransportError("fetch failed")).toBe(false);
    expect(isRetryableAuthTransportError(500)).toBe(false);
  });

  it("returns false for generic errors without transport markers", () => {
    expect(
      isRetryableAuthTransportError(new Error("Something went wrong"))
    ).toBe(false);
    expect(
      isRetryableAuthTransportError({ message: "Validation failed" })
    ).toBe(false);
  });
});
