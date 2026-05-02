import { describe, expect, it } from "vitest";

import {
  buildRateLimitedUserMessage,
  GENERIC_USER_ERROR,
} from "./user-facing-errors";

describe("user-facing-errors", () => {
  it("exposes a stable generic user error string", () => {
    expect(GENERIC_USER_ERROR).toBe("Something went wrong");
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
