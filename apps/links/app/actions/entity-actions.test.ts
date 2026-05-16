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

import {
  getAllLinkDataForExport,
  reorderFolders,
  reorderLinks,
} from "./entity-actions";

const FOLDER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const LINK_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

describe("links entity-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies parent_folder_id on folder reorder updates when provided", async () => {
    let lastUpdatePayload: Record<string, unknown> | null = null;

    const from = vi.fn();
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: FOLDER_ID, parent_folder_id: null }],
              error: null,
            }),
        }),
      }),
    }));
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: FOLDER_ID }],
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

    const result = await reorderFolders(
      [{ id: FOLDER_ID, sort_order: 0, parent_folder_id: null }],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(lastUpdatePayload).toMatchObject({
      sort_order: 0,
      parent_folder_id: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("updates sort_order only when parent_folder_id is omitted", async () => {
    let lastUpdatePayload: Record<string, unknown> | null = null;

    const from = vi.fn();
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: FOLDER_ID, parent_folder_id: null }],
              error: null,
            }),
        }),
      }),
    }));
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: FOLDER_ID }],
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

    const result = await reorderFolders(
      [{ id: FOLDER_ID, sort_order: 2 }],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(lastUpdatePayload).toEqual({
      sort_order: 2,
      updated_at: expect.any(String),
    });
  });

  it("includes folder_id in link reorder updates when provided", async () => {
    let lastUpdatePayload: Record<string, unknown> | null = null;

    const from = vi.fn();
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: LINK_ID, folder_id: null }],
              error: null,
            }),
        }),
      }),
    }));
    from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          in: () =>
            Promise.resolve({
              data: [{ id: LINK_ID }],
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

    const result = await reorderLinks(
      [{ id: LINK_ID, sort_order: 0, folder_id: FOLDER_ID }],
      "csrf-token"
    );

    expect(result).toEqual({ success: true });
    expect(lastUpdatePayload).toMatchObject({
      sort_order: 0,
      folder_id: FOLDER_ID,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/links");
  });

  it("uses EXPORT readRateLimitConfig for getAllLinkDataForExport", async () => {
    mocks.authenticateAndRateLimit.mockResolvedValue({
      ok: false,
      response: { success: false, error: "rate limited" },
    });

    await getAllLinkDataForExport();

    expect(mocks.authenticateAndRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        rateLimitPrefix: "export",
        readRateLimitConfig: { maxRequests: 5, windowMs: 60_000 },
      })
    );
  });
});
