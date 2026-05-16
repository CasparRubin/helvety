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
