import { describe, expect, it } from "vitest";

import {
  buildRateLimitedUserMessage,
  EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR,
  GENERIC_USER_ERROR,
} from "./user-facing-errors";

describe("user-facing-errors", () => {
  it("exposes a stable generic user error string", () => {
    expect(GENERIC_USER_ERROR).toBe("Something went wrong");
  });

  it("exposes extension allowlist user error copy", () => {
    expect(EXTENSION_ORIGIN_NOT_ALLOWLISTED_USER_ERROR).toContain(
      "not authorized to sign in yet"
    );
  });

  it("builds default rate-limit copy with fallback seconds", () => {
    expect(buildRateLimitedUserMessage(undefined)).toBe(
      "Too many requests. Wait 60 seconds, then try again."
    );
    expect(buildRateLimitedUserMessage(30)).toBe(
      "Too many requests. Wait 30 seconds, then try again."
    );
  });

  it("builds download-specific rate-limit copy", () => {
    expect(buildRateLimitedUserMessage(45, "download")).toBe(
      "Too many download requests. Wait 45 seconds, then try again."
    );
  });
});
