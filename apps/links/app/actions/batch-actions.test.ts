import { ACTION_LIMITS } from "@helvety/shared/constants";
import { DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR } from "@helvety/shared/dashboard-prefetch";
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

import { getLinksDashboardData } from "./batch-actions";

import type { LinkFolderRow, LinkRow } from "@/lib/types";

/**
 *
 */
type DashboardQueryResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
};

/**
 *
 */
function makeFolderRow(
  overrides: Partial<LinkFolderRow> & Pick<LinkFolderRow, "id">
): LinkFolderRow {
  return {
    user_id: "user-1",
    parent_folder_id: null,
    encrypted_name: "enc-folder",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 *
 */
function makeLinkRow(
  overrides: Partial<LinkRow> & Pick<LinkRow, "id">
): LinkRow {
  return {
    user_id: "user-1",
    folder_id: null,
    encrypted_name: "enc-name",
    encrypted_url: "enc-url",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 *
 */
function createLinksDashboardSupabaseMock(
  foldersResult: DashboardQueryResult<LinkFolderRow>,
  linksResult: DashboardQueryResult<LinkRow>
) {
  const makeQuery = (
    result: DashboardQueryResult<LinkFolderRow | LinkRow>
  ) => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          order: () => ({
            limit: () => ({
              overrideTypes: () => Promise.resolve(result),
            }),
          }),
        }),
      }),
    }),
  });

  return {
    from: (table: string) => {
      if (table === "link_folders") {
        return makeQuery(foldersResult);
      }
      if (table === "links") {
        return makeQuery(linksResult);
      }
      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe("links batch-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth failure without logging when authenticateAndRateLimit fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const result = await getLinksDashboardData();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when folder query fails", async () => {
    const dbError = { message: "timeout", code: "57014" };
    const supabase = createLinksDashboardSupabaseMock(
      { data: null, error: dbError },
      { data: [], error: null }
    );
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getLinksDashboardData();

    expect(result).toEqual({
      success: false,
      error: "Failed to load dashboard data",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error in getLinksDashboardData (folders)",
      dbError
    );
  });

  it("returns success with folders and links when queries succeed", async () => {
    const folders = [
      makeFolderRow({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
    ];
    const links = [makeLinkRow({ id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" })];
    const supabase = createLinksDashboardSupabaseMock(
      { data: folders, error: null },
      { data: links, error: null }
    );
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getLinksDashboardData();

    expect(result).toEqual({
      success: true,
      data: { folders, links },
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("rejects when either table exceeds the dashboard cap", async () => {
    const folders = Array.from(
      { length: ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1 },
      (_, i) =>
        makeFolderRow({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          sort_order: i,
        })
    );
    const supabase = createLinksDashboardSupabaseMock(
      { data: folders, error: null },
      { data: [], error: null }
    );
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const result = await getLinksDashboardData();

    expect(result).toEqual({
      success: false,
      error: DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
    });
    expect(mocks.logUnexpectedError).not.toHaveBeenCalled();
  });

  it("logs via logUnexpectedError when the query promise rejects", async () => {
    const boom = new Error("network failure");
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: {
          from: () => {
            throw boom;
          },
        },
      },
    });

    const result = await getLinksDashboardData();

    expect(result).toEqual({
      success: false,
      error: GENERIC_USER_ERROR,
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Unexpected error in getLinksDashboardData",
      boom
    );
  });
});
