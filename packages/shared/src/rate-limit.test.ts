import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };
vi.mock("server-only", () => ({}));

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("checkRateLimit policy behavior", () => {
  it("fails closed in production with strict policy when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("test-key", 5, 60_000, "api", "strict");

    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("allows requests in production with soft policy when Redis is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("test-key", 5, 60_000, "api", "soft");

    expect(result.allowed).toBe(true);
  });

  it("locks out after escalating OTP threshold and resets on success", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const {
      recordOtpFailureAndCheckLockout,
      checkEscalatingLockout,
      resetEscalatingLockout,
    } = await import("./rate-limit");

    const email = "user@example.com";

    for (let i = 0; i < 14; i++) {
      const result = await recordOtpFailureAndCheckLockout(email);
      expect(result.allowed).toBe(true);
    }

    const thresholdHit = await recordOtpFailureAndCheckLockout(email);
    expect(thresholdHit.allowed).toBe(false);
    expect(thresholdHit.retryAfter).toBeGreaterThan(0);

    const activeLockout = await checkEscalatingLockout(email);
    expect(activeLockout.allowed).toBe(false);
    expect(activeLockout.retryAfter).toBeGreaterThan(0);

    await resetEscalatingLockout(email);
    const afterReset = await checkEscalatingLockout(email);
    expect(afterReset.allowed).toBe(true);
  });
});
