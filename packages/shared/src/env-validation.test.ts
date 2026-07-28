import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("env-validation", () => {
  it("exposes Upstash placeholder for store env modules", async () => {
    const { getCiPlaceholderUpstashEnv } = await import("./env-validation");

    const env = getCiPlaceholderUpstashEnv();
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.UPSTASH_REDIS_REST_TOKEN.length).toBeGreaterThan(0);
  });

  it("detects real Upstash env when both credentials are set", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { hasRealUpstashEnv } = await import("./env-validation");
    expect(hasRealUpstashEnv()).toBe(false);

    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const { hasRealUpstashEnv: hasUpstash } = await import("./env-validation");
    expect(hasUpstash()).toBe(true);
  });

  it("createAppUpstashEnv uses CI placeholder when Upstash is unset", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { createAppUpstashEnv, upstashEnvSchema } =
      await import("./env-validation");

    const env = createAppUpstashEnv({
      appName: "store",
      envTemplatePath: "apps/store/env.template",
      schema: upstashEnvSchema,
    })();
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.UPSTASH_REDIS_REST_TOKEN).toMatch(/^ci_build_placeholder/);
  });

  it("createAppUpstashEnv caches validated env on first call", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { createAppUpstashEnv, upstashEnvSchema } =
      await import("./env-validation");

    const getValidated = createAppUpstashEnv({
      appName: "store",
      envTemplatePath: "apps/store/env.template",
      schema: upstashEnvSchema,
    });

    const first = getValidated();
    const second = getValidated();
    expect(second).toBe(first);
    expect(first.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
  });

  it("createAppUpstashEnv rejects invalid Upstash URL in production-like runs", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "not-a-url");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const { createAppUpstashEnv, upstashEnvSchema } =
      await import("./env-validation");

    expect(() =>
      createAppUpstashEnv({
        appName: "store",
        envTemplatePath: "apps/store/env.template",
        schema: upstashEnvSchema,
      })()
    ).toThrow(/Invalid environment variables/i);
  });

  it("getValidatedGatewayEnv uses placeholders in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.STORE_URL;

    const { getValidatedGatewayEnv } = await import("./env-validation");
    const env = getValidatedGatewayEnv();
    expect(env.STORE_URL).toMatch(/^https:\/\//);
    expect(env.OCR_URL).toMatch(/^https:\/\//);
  });

  it("does not export retired env factories", async () => {
    const mod = await import("./env-validation");

    expect(mod).not.toHaveProperty("createAppUserScopedEnv");
    expect(mod).not.toHaveProperty("createAppUserScopedE2eeEnv");
    expect(mod).not.toHaveProperty("createAppServerUpstashEnv");
    expect(mod).not.toHaveProperty("createAppUpstashCookieEnv");
    expect(mod).not.toHaveProperty("getSupabaseUrl");
    expect(mod).not.toHaveProperty("getSupabaseKey");
    expect(mod).not.toHaveProperty("serverEnvSchema");
    expect(mod).not.toHaveProperty("cookieSigningEnvSchema");
    expect(mod).not.toHaveProperty("deviceTrustEnvSchema");
    expect(mod).toHaveProperty("createAppUpstashEnv");
    expect(mod).toHaveProperty("upstashEnvSchema");
    expect(mod).toHaveProperty("isCiBuildPlaceholderEnvEnabled");
  });
});
