import { describe, expect, it, vi } from "vitest";

const loggerMocks = vi.hoisted(() => ({
  logUnexpectedError: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: {
    logUnexpectedError: loggerMocks.logUnexpectedError,
  },
}));

import { ACTION_LIMITS } from "./constants";
import {
  isExportWithinCap,
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
  });
});
