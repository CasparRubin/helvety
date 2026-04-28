import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateAndRateLimit: vi.fn(),
  logUnexpectedError: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@helvety/shared/action-helpers", () => ({
  authenticateAndRateLimit: mocks.authenticateAndRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    logUnexpectedError: mocks.logUnexpectedError,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  after: (callback: () => void) => callback(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { getAllTaskDataForExport, reorderEntities } from "./entity-actions";

const TASK_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("tasks entity-actions getAllTaskDataForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses EXPORT readRateLimitConfig for getAllTaskDataForExport", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "rate limited" },
    });

    await getAllTaskDataForExport();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        rateLimitPrefix: "export",
        readRateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
      })
    );
  });

  it("revalidates tasks route after successful reorder", async () => {
    const from = vi.fn();
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: TASK_ID }],
              error: null,
            }),
        }),
      }),
    }));
    from.mockImplementation(() => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }));
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: true,
      ctx: {
        user: { id: "user-1" },
        supabase: { from },
      },
    });

    const result = await reorderEntities(
      "item",
      [{ id: TASK_ID, sort_order: 0 }],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tasks");
  });
});
