import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
  verifyExtensionWeeklyProof: vi.fn(),
}));

vi.mock("@helvety/shared/env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "sb_publishable_test_key_1234567890",
}));

vi.mock("@helvety/shared/extension-weekly-proof-server", () => ({
  verifyExtensionWeeklyProof: mocks.verifyExtensionWeeklyProof,
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

  it("rejects Bearer requests without weekly proof header", async () => {
    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: { Authorization: "Bearer access-token-123" },
      })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Weekly email verification expired/i);
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects empty Bearer tokens", async () => {
    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: {
          Authorization: "Bearer ",
          "X-Helvety-Weekly-Proof": "signed-proof",
        },
      })
    );
    expect(result).toEqual({ ok: false, error: "Not authenticated" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects when Supabase getUser fails", async () => {
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "invalid JWT" },
        }),
      },
    });

    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: {
          Authorization: "Bearer access-token-123",
          "X-Helvety-Weekly-Proof": "signed-proof",
        },
      })
    );

    expect(result).toEqual({ ok: false, error: "Not authenticated" });
    expect(mocks.verifyExtensionWeeklyProof).not.toHaveBeenCalled();
  });

  it("rejects when weekly proof HMAC verification fails", async () => {
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "a@example.com" } },
          error: null,
        }),
      },
    });
    mocks.verifyExtensionWeeklyProof.mockReturnValue(null);

    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: {
          Authorization: "Bearer access-token-123",
          "X-Helvety-Weekly-Proof": "bad-proof",
        },
      })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Weekly email verification expired/i);
    }
    expect(mocks.verifyExtensionWeeklyProof).toHaveBeenCalledWith(
      "bad-proof",
      "user-1"
    );
  });

  it("validates JWT and weekly proof via Supabase + HMAC", async () => {
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "a@example.com" } },
          error: null,
        }),
      },
    });
    mocks.verifyExtensionWeeklyProof.mockReturnValue({
      v: 1,
      userId: "user-1",
      iat: 1,
      exp: 9999999999,
    });

    const result = await authenticateBearerRequest(
      new Request("https://helvety.com/auth/api/example", {
        headers: {
          Authorization: "Bearer access-token-123",
          "X-Helvety-Weekly-Proof": "signed-proof",
        },
      })
    );

    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test_key_1234567890",
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: false }),
      })
    );
    expect(mocks.verifyExtensionWeeklyProof).toHaveBeenCalledWith(
      "signed-proof",
      "user-1"
    );
    expect(result).toEqual({
      ok: true,
      ctx: {
        user: { id: "user-1", email: "a@example.com" },
        weeklyProof: "signed-proof",
      },
    });
  });
});
