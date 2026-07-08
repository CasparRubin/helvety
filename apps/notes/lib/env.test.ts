import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("getValidatedNotesEnv", () => {
  it("uses CI placeholders when local validation is skipped", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    delete process.env.DEVICE_TRUST_COOKIE_SECRET;

    const { getValidatedNotesEnv } = await import("./env");
    const env = getValidatedNotesEnv();

    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.HELVETY_COOKIE_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.DEVICE_TRUST_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("rejects production-like runs with a short device trust secret", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv(
      "HELVETY_COOKIE_SIGNING_SECRET",
      "real_cookie_signing_secret_for_tests_1234567890"
    );
    vi.stubEnv("DEVICE_TRUST_COOKIE_SECRET", "too-short");

    const { getValidatedNotesEnv } = await import("./env");

    expect(() => getValidatedNotesEnv()).toThrow(
      /Invalid environment variables/i
    );
  });
});
