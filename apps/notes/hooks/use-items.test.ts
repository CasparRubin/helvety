import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNotesApiPath, useItems } from "./use-items";

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
  encryptItemInput: vi.fn(),
  encryptItemUpdate: vi.fn(),
}));

describe("getNotesApiPath", () => {
  it("prefixes note API routes with the notes base path", () => {
    expect(getNotesApiPath("/api/items")).toBe("/notes/api/items");
    expect(getNotesApiPath("/api/items/abc-123")).toBe(
      "/notes/api/items/abc-123"
    );
  });
});

describe("useItems", () => {
  it("delegates list behavior to the shared encrypted sortable hook", () => {
    renderHook(() => useItems());

    expect(vi.mocked(useEncryptedSortableItems)).toHaveBeenCalledWith(
      expect.objectContaining({
        navigationSource: "notes-use-items",
        perfMeasureName: "notes:list-refresh-duration",
        loadFailureMessage: "Failed to load notes",
        reorderEntities: expect.any(Function),
      })
    );
  });

  it("exports save-first create from the shared sortable hook", () => {
    const create = vi.fn();
    vi.mocked(useEncryptedSortableItems).mockReturnValueOnce({
      items: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: vi.fn(),
      create,
      update: vi.fn(),
      remove: vi.fn(),
      reorder: vi.fn(),
      patchLocal: vi.fn(),
    });

    const { result } = renderHook(() => useItems());

    expect(result.current.create).toBe(create);
  });

  it("merges note category_id in create and update payloads", () => {
    renderHook(() => useItems());

    const options = vi.mocked(useEncryptedSortableItems).mock.calls.at(-1)?.[0];
    expect(options).toBeDefined();

    const encrypted = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      encrypted_title: "enc-title",
      encrypted_description: null,
    };

    expect(
      options!.buildCreatePayload(encrypted, {
        title: "Note",
        category_id: "work",
      })
    ).toEqual({
      ...encrypted,
      category_id: "work",
    });

    expect(
      options!.buildUpdatePayload(
        "550e8400-e29b-41d4-a716-446655440000",
        encrypted,
        {
          category_id: "personal",
        }
      )
    ).toEqual({
      ...encrypted,
      category_id: "personal",
    });
  });
});
