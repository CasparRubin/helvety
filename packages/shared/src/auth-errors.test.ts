import { describe, expect, it } from "vitest";

import {
  buildAuthHardLogoutError,
  buildAuthRequiredError,
  classifyActionAuthError,
  isAuthRequiredError,
  normalizeActionError,
  shouldForceHardLogout,
  shouldForceHardLogoutFromActionError,
} from "./auth-errors";

describe("auth-errors", () => {
  it("builds and normalizes AUTH_REQUIRED errors", () => {
    const error = buildAuthRequiredError("Session missing");

    expect(error).toBe("AUTH_REQUIRED:Session missing");
    expect(isAuthRequiredError(error)).toBe(true);
    expect(normalizeActionError(error)).toBe("Session missing");
    expect(classifyActionAuthError(error)).toBe("login");
    expect(shouldForceHardLogoutFromActionError(error)).toBe(false);
  });

  it("builds and classifies AUTH_HARD_LOGOUT errors", () => {
    const error = buildAuthHardLogoutError("Encryption state invalid");

    expect(error).toBe("AUTH_HARD_LOGOUT:Encryption state invalid");
    expect(normalizeActionError(error)).toBe("Encryption state invalid");
    expect(classifyActionAuthError(error)).toBe("hard_logout");
    expect(shouldForceHardLogoutFromActionError(error)).toBe(true);
  });

  it("classifies plain auth-required messages as login intent", () => {
    expect(classifyActionAuthError("Not authenticated")).toBe("login");
    expect(classifyActionAuthError("Unauthorized access")).toBe("login");
    expect(classifyActionAuthError("JWT expired")).toBe("login");
  });

  it("classifies only explicit terminal messages as hard logout", () => {
    expect(classifyActionAuthError("Failed to check encryption status")).toBe(
      "hard_logout"
    );
    expect(classifyActionAuthError("Security validation failed")).toBe(
      "hard_logout"
    );
    expect(classifyActionAuthError("Invalid refresh token")).toBe(
      "hard_logout"
    );
  });

  it("does not force hard logout for generic session/token wording", () => {
    expect(classifyActionAuthError("Session temporarily unavailable")).toBe(
      "none"
    );
    expect(classifyActionAuthError("Token refresh in progress")).toBe("none");
    expect(shouldForceHardLogout("Session temporarily unavailable")).toBe(
      false
    );
  });
});
