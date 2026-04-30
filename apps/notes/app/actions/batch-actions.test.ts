import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  createDashboardListSupabaseMock,
  createRejectingDashboardListSupabaseMock,
} from "@helvety/shared/test-utils/action-test-helpers";
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

/** Fluent query mock shape used by dashboard data tests. */
type DashboardQueryMock = {
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  overrideTypes: ReturnType<typeof vi.fn>;
};

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
    const supabase = createDashboardListSupabaseMock("notes", {
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
    const supabase = createDashboardListSupabaseMock("notes", {
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

  it("queries only owned notes with stable ordering and dashboard limit", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({
      data: [makeNoteRow({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })],
      error: null,
    });
    const query = {} as DashboardQueryMock;
    query.eq = vi.fn(() => query);
    query.order = vi
      .fn()
      .mockImplementationOnce(() => query)
      .mockImplementationOnce(() => query);
    query.limit = vi.fn(() => query);
    query.overrideTypes = overrideTypes;
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    await getFlatItemsDashboardData();

    expect(supabase.from).toHaveBeenCalledWith("notes");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(query.limit).toHaveBeenCalledWith(
      ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1
    );
    expect(overrideTypes).toHaveBeenCalled();
  });

  it("rejects when row count exceeds dashboard cap", async () => {
    const rows = Array.from(
      { length: ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1 },
      (_, i) =>
        makeNoteRow({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          sort_order: i,
        })
    );
    const supabase = createDashboardListSupabaseMock("notes", {
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
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: createRejectingDashboardListSupabaseMock("notes", boom),
      },
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
