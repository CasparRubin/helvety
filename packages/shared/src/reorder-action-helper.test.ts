import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  reorderOwnedEntities: vi.fn(),
  mapReorderOwnedEntitiesFailure: vi.fn(),
  parseActionInput: vi.fn(),
}));

vi.mock("./action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("./entity-action-primitives", () => ({
  reorderOwnedEntities: mocks.reorderOwnedEntities,
  mapReorderOwnedEntitiesFailure: mocks.mapReorderOwnedEntitiesFailure,
}));

vi.mock("./server-action-primitives", async () => {
  const actual = await vi.importActual("./server-action-primitives");
  return {
    ...actual,
    parseActionInput: mocks.parseActionInput,
  };
});

import { runOwnedReorderAction } from "./reorder-action-helper";

describe("runOwnedReorderAction", () => {
  it("short-circuits when authentication fails", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "auth failed" },
    });

    const result = await runOwnedReorderAction({
      csrfToken: "csrf",
      rateLimitPrefix: "notes",
      schema: z.array(z.object({ id: z.string(), sort_order: z.number() })),
      updates: [{ id: "1", sort_order: 0 }],
      warnMessage: "warn",
      invalidDataMessage: "invalid",
      tableName: "notes",
      entityType: "item",
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "bad scope",
      buildUpdateObject: (update) => ({ sort_order: update.sort_order }),
    });

    expect(result).toEqual({ success: false, error: "auth failed" });
    expect(mocks.parseActionInput).not.toHaveBeenCalled();
  });

  it("runs validation, optional scope checks, and success callback", async () => {
    const updates = [{ id: "row-1", sort_order: 1 }];
    const onSuccess = vi.fn();
    const validateScope = vi.fn().mockResolvedValue({ success: true });
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn() },
      },
    });
    mocks.parseActionInput.mockReturnValue({ success: true, data: updates });
    mocks.reorderOwnedEntities.mockResolvedValue({ success: true });
    mocks.mapReorderOwnedEntitiesFailure.mockReturnValue(null);

    const result = await runOwnedReorderAction({
      csrfToken: "csrf",
      rateLimitPrefix: "notes",
      schema: z.array(z.object({ id: z.string(), sort_order: z.number() })),
      updates,
      warnMessage: "warn",
      invalidDataMessage: "invalid",
      tableName: "notes",
      entityType: "item",
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "bad scope",
      buildUpdateObject: (update, nowIso) => ({
        sort_order: update.sort_order,
        updated_at: nowIso,
      }),
      validateScope,
      onSuccess,
    });

    expect(validateScope).toHaveBeenCalledWith({
      supabase: expect.any(Object),
      userId: "user-1",
      updates,
    });
    expect(mocks.reorderOwnedEntities).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tableName: "notes",
        updates,
      })
    );
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true });
  });

  it("returns the mapped reorder failure without calling success hooks", async () => {
    const updates = [{ id: "row-1", sort_order: 1 }];
    const onSuccess = vi.fn();
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from: vi.fn() },
      },
    });
    mocks.parseActionInput.mockReturnValue({ success: true, data: updates });
    mocks.reorderOwnedEntities.mockResolvedValue({
      success: false,
      error: "Failed to reorder items",
    });
    mocks.mapReorderOwnedEntitiesFailure.mockReturnValue({
      success: false,
      error: "Failed to reorder items",
    });

    const result = await runOwnedReorderAction({
      csrfToken: "csrf",
      rateLimitPrefix: "tasks",
      schema: z.array(z.object({ id: z.string(), sort_order: z.number() })),
      updates,
      warnMessage: "warn",
      invalidDataMessage: "invalid",
      tableName: "items",
      entityType: "item",
      scope: "scope",
      failureMessage: "failed",
      invalidScopeMessage: "bad scope",
      buildUpdateObject: (update) => ({ sort_order: update.sort_order }),
      onSuccess,
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to reorder items",
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
