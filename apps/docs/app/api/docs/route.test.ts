import { DOCS_PREFETCH_TOO_MANY_ROWS_ERROR } from "@helvety/shared/dashboard-prefetch";
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

import { GET as getDocById } from "./[id]/route";
import { GET as getDocs } from "./route";

describe("docs api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses encrypted prefetch auth and rate limits", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Rate limited" },
    });

    await getDocs();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "docs",
      readRateLimitConfig: RATE_LIMITS.PREFETCH,
    });
  });

  it("returns documents list with no-store header", async () => {
    const rows = [{ id: "d-1", user_id: "user-1" }];
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderUpdatedAt = vi.fn(() => ({ limit }));
    const eqUser = vi.fn(() => ({ order: orderUpdatedAt }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await getDocs();
    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.docs);
    expect(supabase.from).toHaveBeenCalledWith("docs");
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: rows,
    });
  });

  it("returns auth failure without querying Supabase", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const response = await getDocs();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("rejects list responses that exceed MAX_DOC_ROWS", async () => {
    const rows = Array.from({ length: 501 }, (_, index) => ({
      id: `d-${index}`,
      user_id: "user-1",
    }));
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderUpdatedAt = vi.fn(() => ({ limit }));
    const eqUser = vi.fn(() => ({ order: orderUpdatedAt }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await getDocs();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: DOCS_PREFETCH_TOO_MANY_ROWS_ERROR,
    });
  });

  it("validates document id on detail route", async () => {
    const response = await getDocById(new Request("https://helvety.com"), {
      params: Promise.resolve({ id: "invalid-id" }),
    });

    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid document ID",
    });
  });
});
