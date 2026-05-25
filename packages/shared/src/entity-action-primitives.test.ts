import { describe, expect, it, vi } from "vitest";

const loggerMocks = vi.hoisted(() => ({
  logUnexpectedError: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: {
    logUnexpectedError: loggerMocks.logUnexpectedError,
    warn: loggerMocks.warn,
    info: loggerMocks.info,
  },
}));

import { ACTION_LIMITS } from "./constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "./encrypted-prefetch-api";
import {
  areExportTablesWithinCap,
  EXPORT_TOO_LARGE_MESSAGE,
  fetchOwnedEncryptedExport,
  isExportWithinCap,
  logEncryptedExportRequested,
  mapReorderOwnedEntitiesFailure,
  reorderOwnedEntities,
  runChunkedReorderUpdates,
  validateOwnedReorderScope,
} from "./entity-action-primitives";

/** Parameter shape for validateOwnedReorderScope. */
type ValidateOwnedReorderScopeParams = Parameters<
  typeof validateOwnedReorderScope
>[0];

/** Supabase shape expected by validateOwnedReorderScope. */
type ReorderSupabase = ValidateOwnedReorderScopeParams["supabase"];

/** Builds the minimal Supabase shape required by reorder scope tests. */
const buildReorderSupabase = (
  from: ReturnType<typeof vi.fn>
): ReorderSupabase => ({ from }) as unknown as ReorderSupabase;

describe("entity-action-primitives", () => {
  it("validates reorder scope when all IDs are owned", async () => {
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: [{ id: "a" }, { id: "b" }],
            error: null,
          }),
        })),
      })),
    }));
    const supabase = buildReorderSupabase(from);

    const result = await validateOwnedReorderScope({
      supabase,
      userId: "user-1",
      tableName: "items",
      ids: ["a", "b"],
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "invalid",
    });

    expect(result).toEqual({ success: true });
  });

  it("returns invalid scope when owned row count mismatches", async () => {
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: [{ id: "a" }],
            error: null,
          }),
        })),
      })),
    }));
    const supabase = buildReorderSupabase(from);

    const result = await validateOwnedReorderScope({
      supabase,
      userId: "user-1",
      tableName: "items",
      ids: ["a", "b"],
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "invalid",
    });

    expect(result).toEqual({ success: false, error: "invalid" });
  });

  it("returns failure message and logs when ownership query fails", async () => {
    const dbError = new Error("db down");
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: dbError,
          }),
        })),
      })),
    }));
    const supabase = buildReorderSupabase(from);

    const result = await validateOwnedReorderScope({
      supabase,
      userId: "user-1",
      tableName: "items",
      ids: ["a"],
      scope: "reorder scope",
      failureMessage: "failed",
      invalidScopeMessage: "invalid",
    });

    expect(result).toEqual({ success: false, error: "failed" });
    expect(loggerMocks.logUnexpectedError).toHaveBeenCalledWith(
      "reorder scope",
      dbError
    );
  });

  it("runs updates in chunks and surfaces first failing result", async () => {
    const updates = Array.from(
      { length: ACTION_LIMITS.REORDER_CHUNK_SIZE * 2 + 1 },
      (_, i) => ({
        id: String(i),
        sort_order: i,
      })
    );
    let callCount = 0;
    const updateChunk = vi.fn().mockImplementation(async (chunk) => {
      callCount += 1;
      if (callCount === 2) {
        return chunk.map(
          (_: { id: string; sort_order: number }, index: number) => ({
            error: index === 0 ? new Error("bad") : null,
          })
        );
      }
      return chunk.map(() => ({ error: null }));
    });

    const result = await runChunkedReorderUpdates({ updates, updateChunk });

    expect(updateChunk).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
  });

  it("enforces export cap checks", () => {
    expect(isExportWithinCap(0)).toBe(true);
    expect(isExportWithinCap(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE)).toBe(
      true
    );
    expect(isExportWithinCap(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1)).toBe(
      false
    );
    expect(
      areExportTablesWithinCap([1, ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE])
    ).toBe(true);
    expect(
      areExportTablesWithinCap([ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1, 0])
    ).toBe(false);
  });

  it("fetchOwnedEncryptedExport returns rows within cap", async () => {
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: [{ id: "row-1" }],
                error: null,
              }),
          }),
        }),
      }),
    }));
    const supabase = buildReorderSupabase(from);

    const result = await fetchOwnedEncryptedExport<{ id: string }>({
      supabase,
      userId: "user-1",
      tableName: "items",
      selectColumns: ENCRYPTED_PREFETCH_COLUMNS.items,
      logScope: "export scope",
      loadErrorMessage: "load failed",
    });

    expect(result).toEqual({ success: true, rows: [{ id: "row-1" }] });
    expect(from).toHaveBeenCalledWith("items");
  });

  it("fetchOwnedEncryptedExport rejects exports over the row cap", async () => {
    const overCap = Array.from(
      { length: ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1 },
      (_, index) => ({ id: String(index) })
    );
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: overCap, error: null }),
          }),
        }),
      }),
    }));
    const supabase = buildReorderSupabase(from);

    const result = await fetchOwnedEncryptedExport<{ id: string }>({
      supabase,
      userId: "user-1",
      tableName: "notes",
      selectColumns: ENCRYPTED_PREFETCH_COLUMNS.notes,
      logScope: "export scope",
      loadErrorMessage: "load failed",
    });

    expect(result).toEqual({
      success: false,
      error: EXPORT_TOO_LARGE_MESSAGE,
    });
    expect(loggerMocks.warn).toHaveBeenCalled();
  });

  it("logEncryptedExportRequested records structured export metadata", () => {
    logEncryptedExportRequested("tasks", "user-1");
    expect(loggerMocks.info).toHaveBeenCalledWith("Data export requested", {
      source: "tasks",
      userId: "user-1",
    });
  });

  it("maps reorder failures with and without causes", () => {
    expect(
      mapReorderOwnedEntitiesFailure("item", { success: true }, "scope")
    ).toBeNull();
    expect(
      mapReorderOwnedEntitiesFailure(
        "item",
        { success: false, error: "invalid scope" },
        "scope"
      )
    ).toEqual({ success: false, error: "invalid scope" });
    const cause = new Error("db");
    expect(
      mapReorderOwnedEntitiesFailure(
        "item",
        { success: false, error: "failed", cause },
        "scope"
      )
    ).toEqual({ success: false, error: "Failed to reorder items" });
    expect(loggerMocks.logUnexpectedError).toHaveBeenCalledWith("scope", cause);
  });

  it("reorders owned entities and applies update payloads", async () => {
    const eqUser = vi.fn().mockResolvedValue({ error: null });
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqId }));
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "a" }, { id: "b" }],
              error: null,
            }),
          })),
        })),
      }))
      .mockImplementation(() => ({ update }));
    const supabase = buildReorderSupabase(from);

    const result = await reorderOwnedEntities({
      supabase,
      userId: "user-1",
      tableName: "items",
      updates: [
        { id: "a", sort_order: 0, stage_id: "todo" },
        { id: "b", sort_order: 1 },
      ],
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "invalid",
      buildUpdateObject: (entry, nowIso) => ({
        sort_order: entry.sort_order,
        updated_at: nowIso,
        ...(entry.stage_id ? { stage_id: entry.stage_id } : {}),
      }),
    });

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("items");
    expect(update).toHaveBeenCalled();
    expect(eqId).toHaveBeenCalledWith("id", "a");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns failure when chunk update fails", async () => {
    const dbError = new Error("update failed");
    const eqUser = vi.fn().mockResolvedValue({ error: dbError });
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqId }));
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "a" }],
              error: null,
            }),
          })),
        })),
      }))
      .mockImplementation(() => ({ update }));
    const supabase = buildReorderSupabase(from);

    const result = await reorderOwnedEntities({
      supabase,
      userId: "user-1",
      tableName: "items",
      updates: [{ id: "a", sort_order: 0 }],
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "invalid",
      buildUpdateObject: (entry, nowIso) => ({
        sort_order: entry.sort_order,
        updated_at: nowIso,
      }),
    });

    expect(result).toEqual({ success: false, error: "failed", cause: dbError });
  });
});
