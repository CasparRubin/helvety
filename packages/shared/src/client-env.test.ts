import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

const VALID_PUBLIC_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example_key_1234567890",
};

describe("client-env", () => {
  it("accepts publishable Supabase keys", async () => {
    const { clientPublicEnvSchema } = await import("./client-env");
    expect(clientPublicEnvSchema.safeParse(VALID_PUBLIC_ENV).success).toBe(
      true
    );
  });

  it("rejects secret keys in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", async () => {
    const { clientPublicEnvSchema } = await import("./client-env");
    const result = clientPublicEnvSchema.safeParse({
      ...VALID_PUBLIC_ENV,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_not_for_browser",
    });

    expect(result.success).toBe(false);
  });

  it("exposes validated public Supabase URL and key", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      VALID_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    const { getClientSupabaseKey, getClientSupabaseUrl } =
      await import("./client-env");

    expect(getClientSupabaseUrl()).toBe(
      VALID_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_URL
    );
    expect(getClientSupabaseKey()).toBe(
      VALID_PUBLIC_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
  });
});
