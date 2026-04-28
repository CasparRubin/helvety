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

  it("fails closed in production when Redis is not configured for OTP lockout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { recordOtpFailureAndCheckLockout, checkEscalatingLockout } =
      await import("./rate-limit");

    const record = await recordOtpFailureAndCheckLockout("user@example.com");
    expect(record.allowed).toBe(false);
    expect(record.retryAfter).toBeGreaterThan(0);

    const check = await checkEscalatingLockout("user@example.com");
    expect(check.allowed).toBe(false);
    expect(check.retryAfter).toBeGreaterThan(0);
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

describe("RATE_LIMITS.EXPORT", () => {
  it("matches the E2EE bulk-export read limit contract", async () => {
    const { RATE_LIMITS } = await import("./rate-limit");

    expect(RATE_LIMITS.EXPORT).toEqual({
      maxRequests: 5,
      windowMs: 60_000,
    });
  });
});

describe("rate-limit internals", () => {
  it("uses consistent key namespaces for all key types", async () => {
    const { __rateLimitInternals } = await import("./rate-limit");

    expect(
      __rateLimitInternals.buildRateLimitStorageKey(
        "generic",
        "Contacts:USER-1"
      )
    ).toBe("ratelimit:generic:contacts:user-1");
    expect(
      __rateLimitInternals.buildRateLimitStorageKey(
        "otpFailureCounter",
        "USER@example.com"
      )
    ).toBe("ratelimit:otp:lockout:failures:user@example.com");
    expect(
      __rateLimitInternals.buildRateLimitStorageKey(
        "otpLockoutUntil",
        "USER@example.com"
      )
    ).toBe("ratelimit:otp:lockout:until:user@example.com");
  });

  it("records bounded metrics for decisions", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { __rateLimitInternals, checkRateLimit } =
      await import("./rate-limit");
    __rateLimitInternals.clearMetrics();

    await checkRateLimit("test-key", 5, 60_000, "api", "strict");

    expect(__rateLimitInternals.getMetrics().size).toBeGreaterThan(0);
  });

  it("keeps development in-memory fallback separated by prefix", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit, resetRateLimit } = await import("./rate-limit");

    const firstApi = await checkRateLimit("same-key", 1, 60_000, "api", "soft");
    expect(firstApi.allowed).toBe(true);

    const firstAuth = await checkRateLimit(
      "same-key",
      1,
      60_000,
      "auth",
      "soft"
    );
    expect(firstAuth.allowed).toBe(true);

    const secondApi = await checkRateLimit(
      "same-key",
      1,
      60_000,
      "api",
      "soft"
    );
    expect(secondApi.allowed).toBe(false);

    await resetRateLimit("same-key", "api");
    const afterResetApi = await checkRateLimit(
      "same-key",
      1,
      60_000,
      "api",
      "soft"
    );
    expect(afterResetApi.allowed).toBe(true);
  });
});
