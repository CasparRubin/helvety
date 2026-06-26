import { afterEach, describe, expect, it, vi } from "vitest";

import { getAuthUser } from "./auth-retry";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Creates a mock Supabase client with a preset getUser response. */
function createMockSupabase(
  user: { id: string } | null,
  error: { message: string; status?: number; name?: string } | null = null
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
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the user on success", async () => {
    const supabase = createMockSupabase({ id: "u1" });
    const result = await getAuthUser(supabase);

    expect(result.user).toEqual({ id: "u1" });
    expect(result.error).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("returns null user and the error on definitive auth failure without retrying", async () => {
    const supabase = createMockSupabase(null, {
      message: "refresh token not found",
    });
    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error).toEqual({ message: "refresh token not found" });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it("retries transient transport errors and eventually returns the last error", async () => {
    vi.useFakeTimers();

    const supabase = createMockSupabase(null, {
      message: "network timeout",
      status: 408,
    });

    const resultPromise = getAuthUser(supabase);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.user).toBeNull();
    expect(result.error).toEqual({ message: "network timeout", status: 408 });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(3);
  });

  it("retries transient transport errors and returns the user when a later attempt succeeds", async () => {
    vi.useFakeTimers();

    const supabase = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValueOnce({
            data: { user: null },
            error: { message: "fetch failed", status: 0 },
          })
          .mockResolvedValueOnce({
            data: { user: { id: "u1" } },
            error: null,
          }),
      },
    } as unknown as SupabaseClient;

    const resultPromise = getAuthUser(supabase);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.user).toEqual({ id: "u1" });
    expect(result.error).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
  });

  it("returns null user and null error when SDK returns neither", async () => {
    const supabase = createMockSupabase(null, null);
    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });

  it("converts thrown transport errors into returned auth errors without throwing", async () => {
    vi.useFakeTimers();

    const supabase = {
      auth: {
        getUser: vi
          .fn()
          .mockRejectedValueOnce(
            new DOMException("The operation was aborted", "AbortError")
          )
          .mockRejectedValueOnce(
            new DOMException("The operation was aborted", "AbortError")
          )
          .mockRejectedValueOnce(
            new DOMException("The operation was aborted", "AbortError")
          ),
      },
    } as unknown as SupabaseClient;

    const resultPromise = getAuthUser(supabase);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.user).toBeNull();
    expect(result.error?.name).toBe("AbortError");
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(3);
  });

  it("stops retrying when a transient error is followed by a definitive auth failure", async () => {
    vi.useFakeTimers();

    const supabase = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValueOnce({
            data: { user: null },
            error: { message: "fetch failed", status: 0 },
          })
          .mockResolvedValueOnce({
            data: { user: null },
            error: { message: "refresh token not found", status: 401 },
          }),
      },
    } as unknown as SupabaseClient;

    const resultPromise = getAuthUser(supabase);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.user).toBeNull();
    expect(result.error).toEqual({
      message: "refresh token not found",
      status: 401,
    });
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
  });

  it("does not retry thrown definitive auth failures", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockRejectedValue({
          message: "JWT expired",
          status: 401,
          name: "AuthApiError",
        }),
      },
    } as unknown as SupabaseClient;

    const result = await getAuthUser(supabase);

    expect(result.user).toBeNull();
    expect(result.error?.message).toBe("JWT expired");
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });
});
