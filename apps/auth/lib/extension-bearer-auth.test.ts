import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@helvety/shared/env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "sb_publishable_test_key_1234567890",
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

import { authenticateBearerRequest } from "./extension-bearer-auth";

describe("authenticateBearerRequest", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without Bearer header", async () => {
    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example")
    );
    expect(result).toEqual({ ok: false, error: "Not authenticated" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("validates JWT via Supabase using validated public env", async () => {
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "a@example.com" } },
          error: null,
        }),
      },
    });

    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: { Authorization: "Bearer access-token-123" },
      })
    );

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test_key_1234567890",
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: false }),
      })
    );
    expect(result).toEqual({
      ok: true,
      ctx: { user: { id: "user-1", email: "a@example.com" } },
    });
  });
});
