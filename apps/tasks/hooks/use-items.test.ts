import { readFileSync } from "node:fs";
import { join } from "node:path";

import { useEncryptedSingleItem } from "@helvety/ui/hooks/use-encrypted-single-item";
import { useEncryptedSortableItems } from "@helvety/ui/hooks/use-encrypted-sortable-items";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getTasksApiPath, useItem, useItems } from "./use-items";

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

  it("merges task structural metadata in create and update payloads", () => {
    renderHook(() => useItems());

    const options = vi.mocked(useEncryptedSortableItems).mock.calls.at(-1)?.[0];
    expect(options).toBeDefined();

    const encrypted = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      encrypted_title: "enc-title",
      encrypted_description: null,
      encrypted_start_date: null,
      encrypted_end_date: null,
    };

    expect(
      options!.buildCreatePayload(encrypted, {
        title: "Ship",
        stage_id: "default-item-backlog",
        label_id: null,
        priority: 2,
      })
    ).toEqual({
      ...encrypted,
      stage_id: "default-item-backlog",
      label_id: null,
      priority: 2,
    });

    expect(
      options!.buildUpdatePayload(
        "550e8400-e29b-41d4-a716-446655440000",
        encrypted,
        {
          priority: 3,
        }
      )
    ).toEqual({
      ...encrypted,
      priority: 3,
    });
  });
});

describe("useItem", () => {
  it("delegates single-item behavior to the shared encrypted single-item hook", () => {
    renderHook(() => useItem("item-1"));

    expect(vi.mocked(useEncryptedSingleItem)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "item-1",
        navigationSource: "tasks-use-items",
        loadFailureMessage: "Failed to load task",
        deleteMissingIdMessage: "Task ID is missing",
        updateEntity: expect.any(Function),
        deleteEntity: expect.any(Function),
      })
    );
  });

  it("is not used by the tasks dashboard sheet editor (list hook owns saves)", () => {
    const dashboardSrc = readFileSync(
      join(import.meta.dirname, "../components/flat-tasks-dashboard.tsx"),
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
