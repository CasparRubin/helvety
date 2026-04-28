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

import { getAllNoteDataForExport, reorderEntities } from "./entity-actions";

const NOTE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("notes entity-actions reorderEntities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies category_id on reorder updates when provided", async () => {
    let lastUpdatePayload: Record<string, unknown> | null = null;

    const from = vi.fn();
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: NOTE_ID }],
              error: null,
            }),
        }),
      }),
    }));
    from.mockImplementation(() => ({
      update: (obj: Record<string, unknown>) => {
        lastUpdatePayload = obj;
        return {
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      },
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
      [{ id: NOTE_ID, sort_order: 0, category_id: "work" }],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(lastUpdatePayload).toMatchObject({
      sort_order: 0,
      category_id: "work",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
  });

  it("uses EXPORT readRateLimitConfig for getAllNoteDataForExport", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "rate limited" },
    });

    await getAllNoteDataForExport();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        rateLimitPrefix: "export",
        readRateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
      })
    );
  });
});
