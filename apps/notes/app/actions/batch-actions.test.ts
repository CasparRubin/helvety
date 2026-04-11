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

import type { ItemRow } from "@/lib/types";

/** Minimal `notes` row matching current DB shape (including `category_id`). */
function makeNoteRow(
  overrides: Partial<ItemRow> & Pick<ItemRow, "id">
): ItemRow {
  return {
    user_id: "user-1",
    encrypted_title: "enc",
    encrypted_description: null,
    category_id: "personal",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Supabase query builder ending in `.returns()` for notes dashboard rows. */
function createNotesDashboardSupabaseMock(result: {
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
    expect(table).toBe("notes");
    return { select };
  });
  return { from };
}

describe("notes batch-actions", () => {
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
    const dbError = { message: "timeout", code: "57014" };
    const supabase = createNotesDashboardSupabaseMock({
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
    const rows = [makeNoteRow({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })];
    const supabase = createNotesDashboardSupabaseMock({
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
    const rows = Array.from({ length: 2001 }, (_, i) =>
      makeNoteRow({
        id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        sort_order: i,
      })
    );
    const supabase = createNotesDashboardSupabaseMock({
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
    const returns = vi.fn().mockRejectedValue(boom);
    const limit = vi.fn(() => ({ returns }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const from = vi.fn((table: string) => {
      expect(table).toBe("notes");
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
