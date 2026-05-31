import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("env-validation", () => {
  it("accepts modern publishable keys", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc123");

    const { getSupabaseKey } = await import("./env-validation");

    expect(getSupabaseKey()).toBe("sb_publishable_abc123");
  });

  it("rejects modern secret key format for NEXT_PUBLIC key", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_abc123");

    const { getSupabaseKey } = await import("./env-validation");

    expect(() => getSupabaseKey()).toThrow(/valid Supabase publishable key/i);
  });

  it("rejects JWT-shaped keys (publishable-only policy)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vIn0.signature"
    );

    const { getSupabaseKey } = await import("./env-validation");
    expect(() => getSupabaseKey()).toThrow(/valid Supabase publishable key/i);
  });

  it("uses schema-valid public placeholders when SKIP_ENV_VALIDATION=1 off Vercel", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");

    const { getSupabaseKey, getSupabaseUrl } = await import("./env-validation");

    expect(getSupabaseUrl()).toBe("https://ci-build-placeholder.supabase.co");
    expect(getSupabaseKey()).toMatch(/^sb_publishable_ci_build/);
  });

  it("validates real NEXT_PUBLIC_* when SKIP_ENV_VALIDATION=1 off Vercel if both are set", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_realkey123"
    );

    const { getSupabaseKey, getSupabaseUrl } = await import("./env-validation");

    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
    expect(getSupabaseKey()).toBe("sb_publishable_realkey123");
  });

  it("exposes merged server+Upstash placeholder for app env modules", async () => {
    const { getCiPlaceholderServerUpstashEnv } =
      await import("./env-validation");

    const env = getCiPlaceholderServerUpstashEnv();
    expect(env.SUPABASE_SECRET_KEY.length).toBeGreaterThanOrEqual(40);
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.UPSTASH_REDIS_REST_TOKEN.length).toBeGreaterThan(0);
    expect(env.HELVETY_COOKIE_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("detects real cookie signing env independently of Supabase secret", async () => {
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    process.env.SUPABASE_SECRET_KEY = "x".repeat(60);

    const { hasRealCookieSigningEnv } = await import("./env-validation");
    expect(hasRealCookieSigningEnv()).toBe(false);

    vi.resetModules();
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "real_cookie_signing_secret_for_tests_1234567890";

    const { hasRealCookieSigningEnv: hasSigning } =
      await import("./env-validation");
    expect(hasSigning()).toBe(true);
  });

  it("createAppUpstashCookieEnv uses CI placeholder when signing secret is unset", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { createAppUpstashCookieEnv, upstashCookieSigningEnvSchema } =
      await import("./env-validation");

    const env = createAppUpstashCookieEnv({
      appName: "pdf",
      envTemplatePath: "apps/pdf/env.template",
      schema: upstashCookieSigningEnvSchema,
    })();
    expect(env.HELVETY_COOKIE_SIGNING_SECRET).toMatch(
      /^ci_build_placeholder_cookie_signing/
    );
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
  });

  it("createAppUserScopedE2eeEnv caches validated env with device-trust secret for E2EE zones", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;
    delete process.env.DEVICE_TRUST_COOKIE_SECRET;

    const { createAppUserScopedE2eeEnv } = await import("./env-validation");

    const getValidated = createAppUserScopedE2eeEnv({
      appName: "tasks",
      envTemplatePath: "apps/tasks/env.template",
    });

    const env = getValidated();
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.HELVETY_COOKIE_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.DEVICE_TRUST_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32);
    expect("SUPABASE_SECRET_KEY" in env).toBe(false);
  });

  it("getCiPlaceholderUserScopedE2eeEnv includes device-trust secret", async () => {
    const { getCiPlaceholderUserScopedE2eeEnv } =
      await import("./env-validation");

    const env = getCiPlaceholderUserScopedE2eeEnv();
    expect(env.DEVICE_TRUST_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("createAppServerUpstashEnv caches validated env on first call", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;

    const { createAppServerUpstashEnv, serverUpstashMergedSchema } =
      await import("./env-validation");

    const getValidated = createAppServerUpstashEnv({
      appName: "store",
      envTemplatePath: "apps/store/env.template",
      schema: serverUpstashMergedSchema,
    });

    const first = getValidated();
    const second = getValidated();
    expect(second).toBe(first);
    expect(first.SUPABASE_SECRET_KEY).toMatch(/^ci_build_placeholder/);
  });

  it("createAppUpstashCookieEnv caches validated env without admin secret", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    vi.stubEnv("VERCEL", "");
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.HELVETY_COOKIE_SIGNING_SECRET;

    const { createAppUpstashCookieEnv, upstashCookieSigningEnvSchema } =
      await import("./env-validation");

    const getValidated = createAppUpstashCookieEnv({
      appName: "pdf",
      envTemplatePath: "apps/pdf/env.template",
      schema: upstashCookieSigningEnvSchema,
    });

    const env = getValidated();
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.HELVETY_COOKIE_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32);
    expect("SUPABASE_SECRET_KEY" in env).toBe(false);
  });

  it("exposes Upstash+cookie placeholder for public-tool env modules", async () => {
    const { getCiPlaceholderUpstashCookieEnv } =
      await import("./env-validation");

    const env = getCiPlaceholderUpstashCookieEnv();
    expect(env.UPSTASH_REDIS_REST_URL).toMatch(/^https:\/\//);
    expect(env.UPSTASH_REDIS_REST_TOKEN.length).toBeGreaterThan(0);
    expect(env.HELVETY_COOKIE_SIGNING_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("getValidatedGatewayEnv uses placeholders in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.AUTH_URL;

    const { getValidatedGatewayEnv } = await import("./env-validation");
    const env = getValidatedGatewayEnv();
    expect(env.AUTH_URL).toMatch(/^https:\/\//);
    expect(env.DOCS_URL).toMatch(/^https:\/\//);
    expect(env.LINKS_URL).toMatch(/^https:\/\//);
  });

  it("createAppUpstashCookieEnv rejects short signing secrets in production-like runs", async () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HELVETY_COOKIE_SIGNING_SECRET", "too-short");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const { createAppUpstashCookieEnv, upstashCookieSigningEnvSchema } =
      await import("./env-validation");

    expect(() =>
      createAppUpstashCookieEnv({
        appName: "pdf",
        envTemplatePath: "apps/pdf/env.template",
        schema: upstashCookieSigningEnvSchema,
      })()
    ).toThrow(/Invalid environment variables/i);
  });
});
