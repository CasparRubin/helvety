import { describe, expect, it, vi } from "vitest";

import { fetchUserPasskeyParamsForUser } from "./user-passkey-params-db";

const logUnexpectedError = vi.hoisted(() => vi.fn());

vi.mock("./logger", () => ({
  logger: {
    logUnexpectedError,
  },
}));

describe("fetchUserPasskeyParamsForUser", () => {
  const userId = "11111111-1111-4111-8111-111111111111";

  it("returns null params when row is missing (PGRST116)", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { code: "PGRST116", message: "not found" },
            })),
          })),
        })),
      })),
    };

    const result = await fetchUserPasskeyParamsForUser(
      supabase as never,
      userId,
      "test-scope"
    );

    expect(result).toEqual({ ok: true, params: null });
    expect(logUnexpectedError).not.toHaveBeenCalled();
  });

  it("returns ok:false and logs on unexpected PostgREST errors", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { code: "XX000", message: "db down" },
            })),
          })),
        })),
      })),
    };

    const result = await fetchUserPasskeyParamsForUser(
      supabase as never,
      userId,
      "passkey-params-read"
    );

    expect(result).toEqual({ ok: false });
    expect(logUnexpectedError).toHaveBeenCalledWith(
      "passkey-params-read",
      expect.objectContaining({ code: "XX000" })
    );
  });

  it("returns typed params on success", async () => {
    const row = {
      user_id: userId,
      prf_salt: "c2FsdA==",
      version: 1,
      credential_id: "cred",
      key_check_value: null,
    };
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: row, error: null })),
          })),
        })),
      })),
    };

    const result = await fetchUserPasskeyParamsForUser(
      supabase as never,
      userId,
      "test-scope"
    );

    expect(result).toEqual({ ok: true, params: row });
  });
});
