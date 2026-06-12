import {
  getAuthProbeBlockRemainingMs,
  getUserSingleflight,
  invalidateAuthUserProbeCache,
  resetAuthProbeSingleflightStateForTests,
} from "@helvety/ui/auth-session-singleflight";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal getUser response shape used by the singleflight tests. */
type MockGetUserResult = {
  data: { user: { id: string } | null };
  error: { message: string; status?: number } | null;
};

/** Creates a mock Supabase client with queued getUser responses. */
function createSupabaseMock(results: MockGetUserResult[]) {
  const getUser = vi.fn(async () => {
    const next = results.shift();
    if (!next) {
      return {
        data: { user: null },
        error: null,
      };
    }
    return next;
  });

  return {
    auth: {
      getUser,
    },
  } as const;
}

describe("auth-session-singleflight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T00:00:00.000Z"));
    resetAuthProbeSingleflightStateForTests();
  });

  afterEach(() => {
    resetAuthProbeSingleflightStateForTests();
    vi.useRealTimers();
  });

  it("reuses cached result while 429 backoff window is active", async () => {
    const supabase = createSupabaseMock([
      {
        data: { user: null },
        error: { message: "Too many requests", status: 429 },
      },
      {
        data: { user: { id: "u_1" } },
        error: null,
      },
    ]);

    const first = await getUserSingleflight(supabase as never, {
      cooldownMs: 0,
    });
    expect(first.error?.status).toBe(429);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_000);
    const second = await getUserSingleflight(supabase as never, {
      cooldownMs: 0,
    });
    expect(second.error?.status).toBe(429);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(getAuthProbeBlockRemainingMs()).toBeGreaterThan(0);

    vi.advanceTimersByTime(5_100);
    const third = await getUserSingleflight(supabase as never, {
      cooldownMs: 0,
    });
    expect(third.data.user?.id).toBe("u_1");
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
    expect(getAuthProbeBlockRemainingMs()).toBe(0);
  });

  it("increases rate-limit backoff exponentially up to the cap", async () => {
    const supabase = createSupabaseMock([
      {
        data: { user: null },
        error: { message: "429", status: 429 },
      },
      {
        data: { user: null },
        error: { message: "429", status: 429 },
      },
    ]);

    await getUserSingleflight(supabase as never, { cooldownMs: 0 });
    const firstRemaining = getAuthProbeBlockRemainingMs();
    expect(firstRemaining).toBeGreaterThanOrEqual(4_900);

    vi.advanceTimersByTime(5_100);
    await getUserSingleflight(supabase as never, { cooldownMs: 0 });
    const secondRemaining = getAuthProbeBlockRemainingMs();
    expect(secondRemaining).toBeGreaterThanOrEqual(9_900);
    expect(secondRemaining).toBeLessThanOrEqual(10_000);
  });

  it("reuses cooldown cache until invalidateAuthUserProbeCache is called", async () => {
    const supabase = createSupabaseMock([
      { data: { user: null }, error: null },
      { data: { user: { id: "u_cached" } }, error: null },
    ]);

    const first = await getUserSingleflight(supabase as never, {
      cooldownMs: 60_000,
    });
    expect(first.data.user).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);

    const cached = await getUserSingleflight(supabase as never, {
      cooldownMs: 60_000,
    });
    expect(cached.data.user).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);

    invalidateAuthUserProbeCache();

    const fresh = await getUserSingleflight(supabase as never, {
      cooldownMs: 60_000,
    });
    expect(fresh.data.user?.id).toBe("u_cached");
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
  });

  it("treats 'request rate limit reached' as rate limited", async () => {
    const supabase = createSupabaseMock([
      {
        data: { user: null },
        error: { message: "Request rate limit reached" },
      },
    ]);

    await getUserSingleflight(supabase as never, { cooldownMs: 0 });
    expect(getAuthProbeBlockRemainingMs()).toBeGreaterThan(0);
  });
});
