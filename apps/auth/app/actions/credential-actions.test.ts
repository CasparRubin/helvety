import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createScopedAdminQuery: vi.fn(),
  createServerClient: vi.fn(),
  logUnexpectedError: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/supabase/admin", () => ({
  createScopedAdminQuery: mocks.createScopedAdminQuery,
}));

vi.mock("@helvety/shared/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

import { getOwnPasskeyStatus } from "./credential-actions";

describe("credential-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "cred-row" }],
          error: null,
          count: 1,
        }),
      })),
    });
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });
  });

  it("returns not authenticated when getUser has no user", async () => {
    mocks.createServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const result = await getOwnPasskeyStatus();

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mocks.createScopedAdminQuery).not.toHaveBeenCalled();
  });

  it("reads credentials via scoped admin for the session user", async () => {
    const result = await getOwnPasskeyStatus();

    expect(mocks.createScopedAdminQuery).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      success: true,
      data: { hasPasskey: true, count: 1 },
    });
  });

  it("returns hasPasskey false when count is zero", async () => {
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      })),
    });

    const result = await getOwnPasskeyStatus();

    expect(result).toEqual({
      success: true,
      data: { hasPasskey: false, count: 0 },
    });
  });

  it("returns failure when scoped select errors", async () => {
    mocks.createScopedAdminQuery.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "db error" },
          count: null,
        }),
      })),
    });

    const result = await getOwnPasskeyStatus();

    expect(result).toEqual({
      success: false,
      error: "Failed to check passkey status",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error checking own passkey status",
      { message: "db error" }
    );
  });
});
