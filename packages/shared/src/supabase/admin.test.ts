import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

vi.mock("../env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
}));

const VALID_SECRET_KEY = "sb_secret_0123456789012345678901234567890123456789";

describe("createAdminClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    process.env.SUPABASE_SECRET_KEY = VALID_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("wires a fetch timeout and non-persistent auth options", async () => {
    const { createAdminClient } = await import("./admin");

    createAdminClient();

    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      VALID_SECRET_KEY,
      expect.objectContaining({
        global: expect.objectContaining({ fetch: expect.any(Function) }),
        auth: expect.objectContaining({
          autoRefreshToken: false,
          persistSession: false,
        }),
      })
    );
  });

  it("returns a singleton instance across calls", async () => {
    const { createAdminClient } = await import("./admin");

    const first = createAdminClient();
    const second = createAdminClient();

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it("throws when SUPABASE_SECRET_KEY is missing", async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow("SUPABASE_SECRET_KEY is not set");
  });

  it("throws when SUPABASE_SECRET_KEY is too short", async () => {
    process.env.SUPABASE_SECRET_KEY = "too-short";
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow(
      "SUPABASE_SECRET_KEY appears too short"
    );
  });

  it("throws when the secret key equals the publishable key", async () => {
    process.env.SUPABASE_SECRET_KEY = VALID_SECRET_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = VALID_SECRET_KEY;
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow(
      "must not be the same as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  });
});

describe("createScopedAdminQuery", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    process.env.SUPABASE_SECRET_KEY = VALID_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("requires a non-empty userId", async () => {
    const { createScopedAdminQuery } = await import("./admin");

    expect(() => createScopedAdminQuery("")).toThrow(
      "createScopedAdminQuery requires a non-empty userId"
    );
  });

  it("scopes select queries by the owner column", async () => {
    const eq = vi.fn(() => "scoped-result");
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    createClientMock.mockReturnValueOnce({ from });

    const { createScopedAdminQuery } = await import("./admin");
    const scoped = createScopedAdminQuery("user-123");
    scoped.from("notes").select();

    expect(from).toHaveBeenCalledWith("notes");
    expect(eq).toHaveBeenCalledWith("user_id", "user-123");
  });

  it("forces the owner field on insert payloads", async () => {
    const insert = vi.fn(() => "inserted");
    const from = vi.fn(() => ({ insert }));
    createClientMock.mockReturnValueOnce({ from });

    const { createScopedAdminQuery } = await import("./admin");
    const scoped = createScopedAdminQuery("user-123");
    scoped.from("notes").insert({ title: "x" });

    expect(insert).toHaveBeenCalledWith(
      { title: "x", user_id: "user-123" },
      undefined
    );
  });

  it("scopes user_profiles by its id column", async () => {
    const eq = vi.fn(() => "scoped-result");
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    createClientMock.mockReturnValueOnce({ from });

    const { createScopedAdminQuery } = await import("./admin");
    const scoped = createScopedAdminQuery("user-123");
    scoped.from("user_profiles").select();

    expect(eq).toHaveBeenCalledWith("id", "user-123");
  });
});
