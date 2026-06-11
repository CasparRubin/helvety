import { ACTION_LIMITS } from "@helvety/shared/constants";
import { DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR } from "@helvety/shared/dashboard-prefetch";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import { RATE_LIMITS } from "@helvety/shared/rate-limit";
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

import { GET } from "./route";

describe("links api library route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses encrypted prefetch auth and rate limits", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Rate limited" },
    });

    await GET();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "links",
      readRateLimitConfig: RATE_LIMITS.PREFETCH,
    });
  });

  it("returns library payload with no-store header", async () => {
    const folders = [{ id: "f-1", user_id: "user-1" }];
    const links = [{ id: "l-1", user_id: "user-1" }];
    const makeQuery = (rows: unknown[]) => {
      const overrideTypes = vi
        .fn()
        .mockResolvedValue({ data: rows, error: null });
      const limit = vi.fn(() => ({ overrideTypes }));
      const orderCreatedAt = vi.fn(() => ({ limit }));
      const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
      const eqUser = vi.fn(() => ({ order: orderSort }));
      const select = vi.fn(() => ({ eq: eqUser }));
      return { select };
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "link_folders") {
          return makeQuery(folders);
        }
        if (table === "links") {
          return makeQuery(links);
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await GET();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { folders, links },
    });
    expect(supabase.from).toHaveBeenCalledWith("link_folders");
    expect(supabase.from).toHaveBeenCalledWith("links");
  });

  it("uses explicit prefetch columns for folders and links", async () => {
    const folders = [{ id: "f-1", user_id: "user-1" }];
    const links = [{ id: "l-1", user_id: "user-1" }];
    const folderSelect = vi.fn();
    const linkSelect = vi.fn();
    const makeQuery = (
      rows: unknown[],
      selectSpy: ReturnType<typeof vi.fn>
    ) => {
      selectSpy.mockImplementation(() => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              limit: () => ({
                overrideTypes: () =>
                  Promise.resolve({ data: rows, error: null }),
              }),
            }),
          }),
        }),
      }));
    };
    makeQuery(folders, folderSelect);
    makeQuery(links, linkSelect);
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "link_folders") {
          return { select: folderSelect };
        }
        if (table === "links") {
          return { select: linkSelect };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    await GET();

    expect(folderSelect).toHaveBeenCalledWith(
      ENCRYPTED_PREFETCH_COLUMNS.link_folders
    );
    expect(linkSelect).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.links);
  });

  it("rejects library responses that exceed the dashboard row cap", async () => {
    const folders = Array.from(
      { length: ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1 },
      (_, index) => ({
        id: `f-${index}`,
        user_id: "user-1",
      })
    );
    const makeQuery = (rows: unknown[]) => {
      const overrideTypes = vi
        .fn()
        .mockResolvedValue({ data: rows, error: null });
      const limit = vi.fn(() => ({ overrideTypes }));
      const orderCreatedAt = vi.fn(() => ({ limit }));
      const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
      const eqUser = vi.fn(() => ({ order: orderSort }));
      return vi.fn(() => ({ eq: eqUser }));
    };
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "link_folders") {
          return { select: makeQuery(folders) };
        }
        if (table === "links") {
          return { select: makeQuery([]) };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await GET();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: DASHBOARD_PREFETCH_TOO_MANY_ITEMS_ERROR,
    });
  });

  it("returns auth failure without querying Supabase", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const response = await GET();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });
});
