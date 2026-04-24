import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

/** Create a minimal JWT-like token with a given role claim. */
function createLegacyJwt(role: "anon" | "authenticated" | "service_role") {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const payload = btoa(JSON.stringify({ role }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${header}.${payload}.signature`;
}

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

    expect(() => getSupabaseKey()).toThrow(
      /valid Supabase anon\/publishable key/i
    );
  });

  it("accepts legacy anon JWT and rejects service_role JWT", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", createLegacyJwt("anon"));

    {
      const { getSupabaseKey } = await import("./env-validation");
      expect(getSupabaseKey()).toContain(".");
    }

    vi.resetModules();
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      createLegacyJwt("service_role")
    );

    {
      const { getSupabaseKey } = await import("./env-validation");
      expect(() => getSupabaseKey()).toThrow(
        /valid Supabase anon\/publishable key/i
      );
    }
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
  });
});
