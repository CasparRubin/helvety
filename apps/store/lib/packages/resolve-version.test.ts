import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const list = vi.fn();
  const from = vi.fn(() => ({ list }));
  const adminClientFactory = vi.fn(() => ({
    storage: { from },
  }));

  return { list, from, adminClientFactory };
});

vi.mock("@helvety/shared/supabase/admin", () => ({
  ["create" + "AdminClient"]: mocks.adminClientFactory,
}));

import { resolveLatestPackageVersion } from "./resolve-version";

describe("resolveLatestPackageVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for unknown package IDs", async () => {
    const result = await resolveLatestPackageVersion("unknown");
    expect(result).toBeNull();
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("selects the newest .sppkg by timestamp", async () => {
    mocks.list.mockResolvedValue({
      data: [
        { name: "notes.txt", id: "x1", created_at: "2026-03-10T10:00:00.000Z" },
        {
          name: "helvety-spo-explorer.sppkg",
          id: "x2",
          created_at: "2026-03-14T10:00:00.000Z",
          updated_at: "2026-03-14T10:00:00.000Z",
        },
        {
          name: "helvety-spo-explorer-hotfix.sppkg",
          id: "x3",
          created_at: "2026-03-15T10:00:00.000Z",
          updated_at: "2026-03-15T10:00:00.000Z",
        },
        { name: "v1.0.4.0", id: null },
      ],
      error: null,
    });

    const result = await resolveLatestPackageVersion("spo-explorer");

    expect(mocks.from).toHaveBeenCalledWith("packages");
    expect(mocks.list).toHaveBeenCalledWith("spfx/helvety-spo-explorer", {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });
    expect(result).toEqual({
      version: "1.0.0.4",
      storagePath:
        "spfx/helvety-spo-explorer/helvety-spo-explorer-hotfix.sppkg",
    });
  });

  it("uses stable name ordering when timestamps are missing", async () => {
    mocks.list.mockResolvedValue({
      data: [
        { name: "a.sppkg", id: "x1", created_at: null, updated_at: null },
        { name: "b.sppkg", id: "x2", created_at: null, updated_at: null },
      ],
      error: null,
    });

    const result = await resolveLatestPackageVersion("spo-explorer");

    expect(result).toEqual({
      version: "1.0.0.4",
      storagePath: "spfx/helvety-spo-explorer/b.sppkg",
    });
  });
});
