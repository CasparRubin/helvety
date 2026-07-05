import { readFileSync } from "node:fs";
import { join } from "node:path";

import { useEncryptedSingleItem } from "@helvety/ui/hooks/use-encrypted-single-item";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getNotesApiPath, useItem, useItems } from "./use-items";

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
    createWithId: vi.fn(),
    seedDraft: vi.fn(),
    removeDraft: vi.fn(),
  })),
}));

vi.mock("@helvety/ui/hooks/use-encrypted-single-item", () => ({
  useEncryptedSingleItem: vi.fn(() => ({
    item: null,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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
});

describe("useItem", () => {
  it("delegates single-item behavior to the shared encrypted single-item hook", () => {
    renderHook(() => useItem("item-1"));

    expect(vi.mocked(useEncryptedSingleItem)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "item-1",
        navigationSource: "notes-use-items",
        loadFailureMessage: "Failed to load note",
        deleteMissingIdMessage:
          "We couldn't identify this note. Please refresh and try again.",
      })
    );
  });

  it("is not used by the notes dashboard sheet editor (list hook owns saves)", () => {
    const dashboardSrc = readFileSync(
      join(import.meta.dirname, "../components/flat-notes-dashboard.tsx"),
      "utf8"
    );
    const editorSrc = readFileSync(
      join(import.meta.dirname, "../components/item-editor.tsx"),
      "utf8"
    );
    expect(dashboardSrc).not.toMatch(/useItem\s*\(/);
    expect(editorSrc).not.toMatch(/useItem\s*\(/);
  });
});
