/* eslint-disable jsdoc/require-jsdoc -- Vitest fixtures and helpers */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEncryptedSortableItems } from "./use-encrypted-sortable-items";

import type { UseEncryptedSortableItemsOptions } from "./use-encrypted-sortable-items";

const reportE2eeHookError = vi.fn().mockReturnValue(false);
const reportE2eeActionFailure = vi.fn().mockReturnValue(false);
const triggerHardLogoutOnce = vi.fn().mockReturnValue(true);

vi.mock("../auth-navigation", () => ({
  reportE2eeHookError: (...args: unknown[]) => reportE2eeHookError(...args),
  reportE2eeActionFailure: (...args: unknown[]) =>
    reportE2eeActionFailure(...args),
  triggerHardLogoutOnce: (...args: unknown[]) => triggerHardLogoutOnce(...args),
}));

vi.mock("../csrf-provider", () => ({
  useCSRFToken: () => "test-csrf",
}));

type TestItem = {
  id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  title: string;
};

type TestInput = { title: string };
type TestRow = { id: string };
type TestReorder = { id: string; sort_order: number };

const masterKey = {} as CryptoKey;

function sampleItem(overrides?: Partial<TestItem>): TestItem {
  return {
    id: "item-1",
    user_id: "user-1",
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    title: "Alpha",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createHookOptions(
  overrides: Partial<
    UseEncryptedSortableItemsOptions<TestItem, TestRow, TestInput, TestReorder>
  > = {}
): UseEncryptedSortableItemsOptions<TestItem, TestRow, TestInput, TestReorder> {
  return {
    navigationSource: "test-use-items",
    perfMeasureName: "test:list-refresh-duration",
    masterKey,
    isUnlocked: true,
    loadFailureMessage: "Failed to load",
    createFailureMessage: "Failed to create",
    updateFailureMessage: "Failed to update",
    deleteFailureMessage: "Failed to delete",
    reorderFailureMessage: "Failed to reorder",
    decryptFailureMessage: "Failed to decrypt",
    fetchRows: vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: "row-1" }] })
      ),
    createItem: vi.fn().mockResolvedValue({
      success: true,
      data: { id: "new-id" },
    }),
    updateItem: vi.fn().mockResolvedValue({ success: true }),
    deleteItem: vi.fn().mockResolvedValue({ success: true }),
    reorderEntities: vi.fn().mockResolvedValue({ success: true }),
    encryptInput: vi.fn().mockResolvedValue({ enc: true }),
    encryptUpdate: vi.fn().mockResolvedValue({ enc: true }),
    decryptRows: vi.fn().mockResolvedValue([sampleItem()]),
    buildCreatePayload: (encrypted: unknown, input: TestInput) => ({
      encrypted,
      title: input.title,
    }),
    buildUpdatePayload: (id: string, encrypted: unknown) => ({ id, encrypted }),
    buildOptimisticItem: (
      input: TestInput,
      prev: TestItem[],
      created: { id: string }
    ) =>
      sampleItem({
        id: created.id,
        title: input.title,
        sort_order: prev.length,
      }),
    applyReorderOptimistic: (prev: TestItem[], updates: TestReorder[]) => {
      const orderById = new Map(updates.map((u) => [u.id, u.sort_order]));
      return prev
        .map((item) =>
          orderById.has(item.id)
            ? { ...item, sort_order: orderById.get(item.id)! }
            : item
        )
        .toSorted((a, b) => a.sort_order - b.sort_order);
    },
    ...overrides,
  };
}

function renderSortableHook(
  overrides: Partial<
    UseEncryptedSortableItemsOptions<TestItem, TestRow, TestInput, TestReorder>
  > = {}
) {
  const options = createHookOptions(overrides);
  const hook = renderHook(() => useEncryptedSortableItems(options));
  return { options, ...hook };
}

describe("useEncryptedSortableItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { href: "https://helvety.com/tasks" },
      writable: true,
      configurable: true,
    });
  });

  it("clears items when refresh runs while the vault is locked", async () => {
    const { result, options } = renderSortableHook({
      masterKey: null,
      isUnlocked: false,
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(options.fetchRows).not.toHaveBeenCalled();
  });

  it("loads decrypted rows from fetchRows on mount", async () => {
    const fetchRows = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: "row-1" }] })
      );
    const decryptRows = vi
      .fn()
      .mockResolvedValue([sampleItem({ id: "loaded-1", title: "Loaded" })]);

    const { result } = renderSortableHook({ fetchRows, decryptRows });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(fetchRows).toHaveBeenCalled();
    expect(result.current.items[0]).toEqual(
      expect.objectContaining({ id: "loaded-1", title: "Loaded" })
    );
  });

  it("hydrates initialEncryptedData without calling fetchRows", async () => {
    const fetchRows = vi.fn();
    const decryptRows = vi
      .fn()
      .mockResolvedValue([sampleItem({ id: "prefetched", title: "From SSR" })]);

    const { result } = renderSortableHook({
      fetchRows,
      initialEncryptedData: [{ id: "enc-row" }],
      decryptRows,
    });

    await waitFor(() =>
      expect(result.current.items[0]?.title).toBe("From SSR")
    );
    expect(fetchRows).not.toHaveBeenCalled();
    expect(decryptRows).toHaveBeenCalledWith([{ id: "enc-row" }], masterKey);
  });

  it("reports action failures when the list fetch returns an error payload", async () => {
    reportE2eeActionFailure.mockReturnValue(false);
    const fetchRows = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, error: "denied" }));

    renderSortableHook({ fetchRows });

    await waitFor(() =>
      expect(reportE2eeActionFailure).toHaveBeenCalledWith(
        "denied",
        expect.objectContaining({
          source: "test-use-items",
          fallback: "Failed to load",
        })
      )
    );
  });

  it("appends a created item with optimistic sort order", async () => {
    const { result } = renderSortableHook();

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      const created = await result.current.create({ title: "Beta" });
      expect(created).toEqual({ id: "new-id" });
    });

    expect(result.current.items.map((item) => item.title)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(result.current.items[1]?.sort_order).toBe(1);
  });

  it("triggers hard logout when create runs without a master key", async () => {
    const { result } = renderSortableHook({
      masterKey: null,
      isUnlocked: true,
    });

    await act(async () => {
      const created = await result.current.create({ title: "Blocked" });
      expect(created).toBeNull();
    });

    expect(triggerHardLogoutOnce).toHaveBeenCalledWith(
      "https://helvety.com/tasks",
      "test-use-items"
    );
  });

  it("restores the list when delete fails and auth navigation does not apply", async () => {
    const deleteItem = vi.fn().mockResolvedValue({
      success: false,
      error: "delete failed",
    });
    reportE2eeActionFailure.mockReturnValue(false);

    const { result } = renderSortableHook({ deleteItem });

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      const ok = await result.current.remove("item-1");
      expect(ok).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.id).toBe("item-1");
  });

  it("patchLocal updates an item without a network round trip", async () => {
    const { result } = renderSortableHook();

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => {
      result.current.patchLocal("item-1", { title: "Patched" });
    });

    expect(result.current.items[0]?.title).toBe("Patched");
  });

  it("refetches after a failed reorder", async () => {
    const fetchRows = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: [{ id: "row-1" }] })
      );
    const reorderEntities = vi.fn().mockResolvedValue({
      success: false,
      error: "reorder failed",
    });
    reportE2eeActionFailure.mockReturnValue(false);

    const { result } = renderSortableHook({ fetchRows, reorderEntities });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    const callsAfterLoad = fetchRows.mock.calls.length;

    await act(async () => {
      const ok = await result.current.reorder([
        { id: "item-1", sort_order: 2 },
      ]);
      expect(ok).toBe(false);
    });

    await waitFor(() =>
      expect(fetchRows.mock.calls.length).toBeGreaterThan(callsAfterLoad)
    );
    expect(reportE2eeActionFailure).toHaveBeenCalledWith(
      "reorder failed",
      expect.objectContaining({
        source: "test-use-items",
        fallback: "Failed to reorder",
      })
    );
  });
});
