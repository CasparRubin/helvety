import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

import { getFlatItemsDashboardData } from "./batch-actions";

/** Supabase query builder ending in `.overrideTypes()` for tasks dashboard items. */
function createItemsDashboardSupabaseMock(result: {
  data: unknown[] | null;
  error: { message: string; code?: string } | null;
}) {
  const overrideTypes = vi.fn().mockResolvedValue(result);
  const limit = vi.fn(() => ({ overrideTypes }));
  const orderCreatedAt = vi.fn(() => ({ limit }));
  const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
  const eqUser = vi.fn(() => ({ order: orderSort }));
  const select = vi.fn(() => ({ eq: eqUser }));
  const from = vi.fn((table: string) => {
    expect(table).toBe("items");
    return { select };
  });
  return { from };
}

describe("tasks batch-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth failure without logging when authenticateAndRateLimit fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const result = await getFlatItemsDashboardData();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when Supabase returns an error", async () => {
    const dbError = { message: "relation missing", code: "42P01" };
    const supabase = createItemsDashboardSupabaseMock({
      data: null,
      error: dbError,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getFlatItemsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "Failed to load dashboard data",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error in getFlatItemsDashboardData",
      dbError
    );
  });

  it("returns success with items when query succeeds", async () => {
    const rows = [{ id: "item-1", user_id: "user-1" }];
    const supabase = createItemsDashboardSupabaseMock({
      data: rows,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getFlatItemsDashboardData();

    expect(result).toEqual({
      success: true,
      data: { items: rows },
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("rejects when row count exceeds dashboard cap", async () => {
    const rows = Array.from({ length: 2001 }, (_, i) => ({
      id: `id-${i}`,
      user_id: "user-1",
    }));
    const supabase = createItemsDashboardSupabaseMock({
      data: rows,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getFlatItemsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "Too many items to load in one request",
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when the query promise rejects", async () => {
    const boom = new Error("network failure");
    const overrideTypes = vi.fn().mockRejectedValue(boom);
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const from = vi.fn((table: string) => {
      expect(table).toBe("items");
      return { select };
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from } },
    });

    const result = await getFlatItemsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Unexpected error in getFlatItemsDashboardData",
      boom
    );
  });
});
