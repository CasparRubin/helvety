import { describe, expect, it, vi } from "vitest";

import { getAuthUser } from "./auth-retry";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Creates a mock Supabase client with a preset getUser response. */
function createMockSupabase(
  user: { id: string } | null,
  error: { message: string; status?: number } | null = null
): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
  } as unknown as SupabaseClient;
}

describe("getAuthUser", () => {
  it("returns the user on success", async () => {
    const supabase = createMockSupabase({ id: "u1" });
    const result = await getAuthUser(supabase);

    expect(result.user).toEqual({ id: "u1" });
    expect(result.error).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("returns null user and the error on failure", async () => {
    const supabase = createMockSupabase(null, {
      message: "refresh token not found",
    });
    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error).toEqual({ message: "refresh token not found" });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("makes only one call even for network-like errors", async () => {
    const supabase = createMockSupabase(null, {
      message: "network timeout",
      status: 408,
    });
    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error).toEqual({ message: "network timeout", status: 408 });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("returns null user and null error when SDK returns neither", async () => {
    const supabase = createMockSupabase(null, null);
    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });
});
