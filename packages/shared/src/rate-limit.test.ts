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
});

describe("RATE_LIMITS", () => {
  it("exposes shared API and READ defaults", async () => {
    const { RATE_LIMITS } = await import("./rate-limit");

    expect(RATE_LIMITS.API).toEqual({
      maxRequests: 100,
      windowMs: 60_000,
    });
    expect(RATE_LIMITS.READ).toEqual({
      maxRequests: 300,
      windowMs: 60_000,
    });
  });
});

describe("rate-limit internals", () => {
  it("uses consistent key namespaces for generic keys", async () => {
    const { rateLimitInternals } = await import("./rate-limit");

    expect(
      rateLimitInternals.buildRateLimitStorageKey("generic", "Store:USER-1")
    ).toBe("ratelimit:generic:store:user-1");
  });

  it("records bounded metrics for decisions", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { rateLimitInternals, checkRateLimit } = await import("./rate-limit");
    rateLimitInternals.clearMetrics();

    await checkRateLimit("test-key", 5, 60_000, "api", "strict");

    expect(rateLimitInternals.getMetrics().size).toBeGreaterThan(0);
  });

  it("keeps development in-memory fallback separated by prefix", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit, resetRateLimit } = await import("./rate-limit");

    const firstApi = await checkRateLimit("same-key", 1, 60_000, "api", "soft");
    expect(firstApi.allowed).toBe(true);

    const firstDownloads = await checkRateLimit(
      "same-key",
      1,
      60_000,
      "downloads",
      "soft"
    );
    expect(firstDownloads.allowed).toBe(true);

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
