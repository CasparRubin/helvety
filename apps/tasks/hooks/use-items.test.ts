import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getTasksApiPath, useItems } from "./use-items";

vi.mock("@helvety/ui/hooks/use-encrypted-sortable-items", () => ({
  useEncryptedSortableItems: vi.fn(() => ({
    items: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    reorder: vi.fn(),
    patchLocal: vi.fn(),
  })),
}));

vi.mock("@/lib/crypto", () => ({
  useEncryptionContext: () => ({
    masterKey: {} as CryptoKey,
    isUnlocked: true,
  }),
  decryptItemRows: vi.fn(),
  decryptItemRow: vi.fn(),
  encryptItemInput: vi.fn(),
  encryptItemUpdate: vi.fn(),
}));

describe("getTasksApiPath", () => {
  it("prefixes task API routes with the tasks base path", () => {
    expect(getTasksApiPath("/api/items")).toBe("/tasks/api/items");
    expect(getTasksApiPath("/api/items/abc-123")).toBe(
      "/tasks/api/items/abc-123"
    );
  });
});

describe("useItems", () => {
  it("delegates list behavior to the shared encrypted sortable hook", () => {
    renderHook(() => useItems());

    expect(vi.mocked(useEncryptedSortableItems)).toHaveBeenCalledWith(
      expect.objectContaining({
        navigationSource: "tasks-use-items",
        perfMeasureName: "tasks:list-refresh-duration",
        loadFailureMessage: "Failed to load tasks",
        reorderEntities: expect.any(Function),
      })
    );
  });
});
