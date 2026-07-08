import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("getValidatedAuthEnv", () => {
  it("uses CI placeholders for auth-only extras when validation is skipped locally", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    delete process.env.DEVICE_TRUST_COOKIE_SECRET;
    delete process.env.HELVETY_CHROME_EXTENSION_ORIGINS;

    const { getValidatedAuthEnv } = await import("./env");
    const env = getValidatedAuthEnv();

    expect(env.SUPABASE_SECRET_KEY).toMatch(/^ci_build_placeholder/);
    expect(env.DEVICE_TRUST_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.HELVETY_CHROME_EXTENSION_ORIGINS).toEqual([
      "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef",
    ]);
  });

  it("normalizes real extension ids into chrome-extension origins", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "SUPABASE_SECRET_KEY",
      "real_supabase_secret_key_used_for_tests_only_1234567890"
    );
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv(
      "HELVETY_COOKIE_SIGNING_SECRET",
      "real_cookie_signing_secret_for_tests_1234567890"
    );
    vi.stubEnv(
      "DEVICE_TRUST_COOKIE_SECRET",
      "real_device_trust_cookie_secret_for_tests_1234567890"
    );
    vi.stubEnv(
      "HELVETY_CHROME_EXTENSION_ORIGINS",
      "abcdefghijklmnopabcdefghijklmnop"
    );

    const { getValidatedAuthEnv } = await import("./env");
    const env = getValidatedAuthEnv();

    expect(env.HELVETY_CHROME_EXTENSION_ORIGINS).toEqual([
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
    ]);
  });
});
