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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { reorderEntities } from "./entity-actions";

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
  });
});
