import { ACTION_LIMITS } from "@helvety/shared/constants";
import { CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR } from "@helvety/shared/dashboard-prefetch";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import {
  createDashboardListSupabaseMock,
  createRejectingDashboardListSupabaseMock,
} from "@helvety/shared/test-utils/action-test-helpers";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
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

/** Fluent query mock shape used by dashboard data tests. */
type DashboardQueryMock = {
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  overrideTypes: ReturnType<typeof vi.fn>;
};

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
    const supabase = createDashboardListSupabaseMock("contacts", {
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
    const supabase = createDashboardListSupabaseMock("contacts", {
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

  it("queries only owned contacts with stable ordering and dashboard limit", async () => {
    const overrideTypes = vi.fn().mockResolvedValue({
      data: [{ id: "c-1", user_id: "user-1" }],
      error: null,
    });
    const query = {} as DashboardQueryMock;
    query.eq = vi.fn(() => query);
    query.order = vi
      .fn()
      .mockImplementationOnce(() => query)
      .mockImplementationOnce(() => query)
      .mockImplementationOnce(() => query);
    query.limit = vi.fn(() => query);
    query.overrideTypes = overrideTypes;
    const select = vi.fn(() => query);
    const supabase = {
      from: vi.fn(() => ({
        select,
      })),
    };
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    await getContactsDashboardData();

    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.contacts);
    expect(supabase.from).toHaveBeenCalledWith("contacts");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.order).toHaveBeenNthCalledWith(1, "category_id", {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "sort_order", {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(3, "created_at", {
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
      (_, i) => ({
        id: `id-${i}`,
        user_id: "user-1",
      })
    );
    const supabase = createDashboardListSupabaseMock("contacts", {
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
      error: CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR,
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when the query promise rejects", async () => {
    const boom = new Error("network failure");
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: createRejectingDashboardListSupabaseMock("contacts", boom),
      },
    });

    const result = await getContactsDashboardData();

    expect(result).toEqual({
      success: false,
      error: GENERIC_USER_ERROR,
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Unexpected error in getContactsDashboardData",
      boom
    );
  });
});
