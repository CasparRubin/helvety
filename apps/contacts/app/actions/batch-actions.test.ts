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

import { getContactsDashboardData } from "./batch-actions";

/** Supabase query builder ending in `.returns()` for contacts dashboard list. */
function createContactsDashboardSupabaseMock(result: {
  data: unknown[] | null;
  error: { message: string; code?: string } | null;
}) {
  const returns = vi.fn().mockResolvedValue(result);
  const limit = vi.fn(() => ({ returns }));
  const orderCreatedAt = vi.fn(() => ({ limit }));
  const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
  const eqUser = vi.fn(() => ({ order: orderSort }));
  const select = vi.fn(() => ({ eq: eqUser }));
  const from = vi.fn((table: string) => {
    expect(table).toBe("contacts");
    return { select };
  });
  return { from };
}

describe("contacts batch-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth failure without logging when authenticateAndRateLimit fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when Supabase returns an error", async () => {
    const dbError = { message: "permission denied", code: "42501" };
    const supabase = createContactsDashboardSupabaseMock({
      data: null,
      error: dbError,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "Failed to load dashboard data",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error in getContactsDashboardData",
      dbError
    );
  });

  it("returns success with contacts when query succeeds", async () => {
    const rows = [{ id: "c-1", user_id: "user-1" }];
    const supabase = createContactsDashboardSupabaseMock({
      data: rows,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({
      success: true,
      data: { contacts: rows },
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("rejects when row count exceeds dashboard cap", async () => {
    const rows = Array.from({ length: 2001 }, (_, i) => ({
      id: `id-${i}`,
      user_id: "user-1",
    }));
    const supabase = createContactsDashboardSupabaseMock({
      data: rows,
      error: null,
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "Too many contacts to load in one request",
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when the query promise rejects", async () => {
    const boom = new Error("network failure");
    const returns = vi.fn().mockRejectedValue(boom);
    const limit = vi.fn(() => ({ returns }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const from = vi.fn((table: string) => {
      expect(table).toBe("contacts");
      return { select };
    });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase: { from } },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Unexpected error in getContactsDashboardData",
      boom
    );
  });
});
