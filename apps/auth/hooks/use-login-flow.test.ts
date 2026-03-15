import { describe, expect, it } from "vitest";

import {
  isRateLimitedLoginAuthSession,
  shouldResetLoginAuthSession,
  withLoginAuthProbeTimeout,
} from "./use-login-flow";

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
