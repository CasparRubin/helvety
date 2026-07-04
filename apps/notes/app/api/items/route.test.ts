import { ACTION_LIMITS } from "@helvety/shared/constants";
import { NOTES_PREFETCH_TOO_MANY_ROWS_ERROR } from "@helvety/shared/dashboard-prefetch";
import { ENCRYPTED_PREFETCH_COLUMNS } from "@helvety/shared/encrypted-prefetch-api";
import { RATE_LIMITS } from "@helvety/shared/rate-limit";
import { createDashboardListSupabaseMock } from "@helvety/shared/test-utils/action-test-helpers";
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

import { GET as getItemById } from "./[id]/route";
import { GET as getItems } from "./route";

describe("notes api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses encrypted prefetch auth and rate limits", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Rate limited" },
    });

    await getItems();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith({
      rateLimitPrefix: "notes",
      readRateLimitConfig: RATE_LIMITS.PREFETCH,
    });
  });

  it("returns notes list with no-store header", async () => {
    const rows = [{ id: "n-1", user_id: "user-1" }];
    const overrideTypes = vi
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const limit = vi.fn(() => ({ overrideTypes }));
    const orderCreatedAt = vi.fn(() => ({ limit }));
    const orderSort = vi.fn(() => ({ order: orderCreatedAt }));
    const eqUser = vi.fn(() => ({ order: orderSort }));
    const select = vi.fn(() => ({ eq: eqUser }));
    const supabase = { from: vi.fn(() => ({ select })) };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await getItems();
    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.notes);
    expect(supabase.from).toHaveBeenCalledWith("notes");
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: rows,
    });
  });

  it("rejects list responses that exceed the dashboard row cap", async () => {
    const rows = Array.from(
      { length: ACTION_LIMITS.MAX_DASHBOARD_ROWS + 1 },
      (_, index) => ({
        id: `n-${index}`,
        user_id: "user-1",
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

    const response = await getItems();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: NOTES_PREFETCH_TOO_MANY_ROWS_ERROR,
    });
  });

  it("returns auth failure without querying Supabase", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const response = await getItems();
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("validates note id on detail route", async () => {
    const response = await getItemById(new Request("https://helvety.com"), {
      params: Promise.resolve({ id: "invalid-id" }),
    });

    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid note ID",
    });
  });

  it("returns auth failure on detail route without querying Supabase", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "Unauthorized" },
    });

    const response = await getItemById(new Request("https://helvety.com"), {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });

    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("returns note not found when row is missing", async () => {
    const single = vi.fn(async () => ({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    }));
    const eqUser = vi.fn(() => ({ single }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqId }));
    const supabase = { from: vi.fn(() => ({ select })) };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await getItemById(new Request("https://helvety.com"), {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });

    expect(select).toHaveBeenCalledWith(ENCRYPTED_PREFETCH_COLUMNS.notes);
    expect(eqId).toHaveBeenCalledWith(
      "id",
      "550e8400-e29b-41d4-a716-446655440000"
    );
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Note not found",
    });
  });

  it("returns encrypted note detail with no-store header", async () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "user-1",
    };
    const single = vi.fn(async () => ({ data: row, error: null }));
    const eqUser = vi.fn(() => ({ single }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const select = vi.fn(() => ({ eq: eqId }));
    const supabase = { from: vi.fn(() => ({ select })) };

    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: { user: { id: "user-1" }, supabase },
    });

    const response = await getItemById(new Request("https://helvety.com"), {
      params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }),
    });

    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: row,
    });
  });
});
