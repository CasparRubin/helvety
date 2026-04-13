import { describe, expect, it } from "vitest";

import {
  buildAuthHardLogoutError,
  buildAuthRequiredError,
  classifyActionAuthError,
  isAuthRequiredError,
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
});
