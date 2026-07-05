/* eslint-disable jsdoc/require-jsdoc -- Vitest fixtures */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEncryptedSingleItem } from "./use-encrypted-single-item";

import type { UseEncryptedSingleItemOptions } from "./use-encrypted-single-item";

const reportE2eeHookError = vi.fn().mockReturnValue(false);
const reportE2eeActionFailure = vi.fn().mockReturnValue(false);
const triggerHardLogoutOnce = vi.fn().mockReturnValue(true);
const toastError = vi.fn();

vi.mock("../auth-navigation", () => ({
  reportE2eeHookError: (...args: unknown[]) => reportE2eeHookError(...args),
  reportE2eeActionFailure: (...args: unknown[]) =>
    reportE2eeActionFailure(...args),
  triggerHardLogoutOnce: (...args: unknown[]) => triggerHardLogoutOnce(...args),
}));

vi.mock("../csrf-provider", () => ({
  useCSRFToken: () => "test-csrf",
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}));

type TestEntity = { id: string; title: string };
type TestRow = { id: string; title: string };
type TestInput = { title: string };
type TestUpdatePayload = {
  id: string;
  title?: string;
  encrypted_title?: string;
};

const masterKey = {} as CryptoKey;

const validEncryptedTitle = JSON.stringify({
  iv: "QUFBQUFBQUFBQUFBQUFBQQ==",
  ciphertext: "QUFBQUFBQUFBQUFBQUFBQQ==",
  version: 2,
});

function createHookOptions(
  overrides: Partial<
    UseEncryptedSingleItemOptions<
      TestEntity,
      TestRow,
      TestInput,
      TestUpdatePayload
    >
  > = {}
): UseEncryptedSingleItemOptions<
  TestEntity,
  TestRow,
  TestInput,
  TestUpdatePayload
> {
  return {
    id: "item-1",
    navigationSource: "test-use-single-item",
    masterKey,
    isUnlocked: true,
    loadFailureMessage: "Failed to load",
    updateFailureMessage: "Failed to update",
    deleteFailureMessage: "Failed to delete",
    decryptFailureMessage: "Failed to decrypt",
    deleteMissingIdMessage: "Missing id",
    fetchById: vi.fn().mockResolvedValue({
      success: true,
      data: { id: "item-1", title: "Alpha" },
    }),
    decryptRow: vi.fn().mockResolvedValue({ id: "item-1", title: "Alpha" }),
    encryptUpdate: vi.fn().mockResolvedValue({
      encrypted_title: validEncryptedTitle,
    }),
    buildUpdatePayload: (id, encrypted) => ({
      id,
      ...(encrypted as Record<string, string>),
    }),
    updateEntity: vi.fn().mockResolvedValue({ success: true }),
    deleteEntity: vi.fn().mockResolvedValue({ success: true }),
    patchEntity: (prev, input) =>
      prev ? { ...prev, ...input } : { id: "item-1", title: input.title ?? "" },
    ...overrides,
  };
}

function renderSingleItemHook(
  overrides: Partial<
    UseEncryptedSingleItemOptions<
      TestEntity,
      TestRow,
      TestInput,
      TestUpdatePayload
    >
  > = {}
) {
  const options = createHookOptions(overrides);
  return { options, ...renderHook(() => useEncryptedSingleItem(options)) };
}

describe("useEncryptedSingleItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { href: "https://helvety.com/tasks/item-1" },
      writable: true,
      configurable: true,
    });
  });

  it("uses initialData without fetching", async () => {
    const fetchById = vi.fn();
    const { result } = renderSingleItemHook({
      fetchById,
      initialData: { id: "item-1", title: "Cached" },
    });

    await waitFor(() => {
      expect(result.current.item).toEqual({ id: "item-1", title: "Cached" });
    });
    expect(fetchById).not.toHaveBeenCalled();
  });

  it("hydrates initialEncryptedData without fetching by id", async () => {
    const fetchById = vi.fn();
    const decryptRow = vi
      .fn()
      .mockResolvedValue({ id: "item-1", title: "From SSR" });
    const { result, options } = renderSingleItemHook({
      fetchById,
      initialEncryptedData: { id: "item-1", title: "enc" },
      decryptRow,
    });

    await waitFor(() => {
      expect(result.current.item?.title).toBe("From SSR");
    });
    expect(fetchById).not.toHaveBeenCalled();
    expect(options.decryptRow).toHaveBeenCalledWith(
      { id: "item-1", title: "enc" },
      masterKey
    );
  });

  it("loads and decrypts a row by id", async () => {
    const decryptRow = vi
      .fn()
      .mockResolvedValue({ id: "item-1", title: "Decrypted" });
    const { result } = renderSingleItemHook({ decryptRow });

    await waitFor(() => {
      expect(result.current.item?.title).toBe("Decrypted");
    });
  });

  it("clears the item when refresh runs while the vault is locked", async () => {
    const { result, options } = renderSingleItemHook({
      masterKey: null,
      isUnlocked: false,
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.item).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(options.fetchById).not.toHaveBeenCalled();
  });

  it("returns null item when fetch fails without redirect", async () => {
    reportE2eeActionFailure.mockReturnValueOnce(false);
    const { result } = renderSingleItemHook({
      fetchById: vi.fn().mockResolvedValue({
        success: false,
        error: "Not found",
      }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.item).toBeNull();
    expect(reportE2eeActionFailure).toHaveBeenCalledWith(
      "Not found",
      expect.objectContaining({
        source: "test-use-single-item",
        fallback: "Failed to load",
        redirectUri: "https://helvety.com/tasks/item-1",
      })
    );
  });

  it("ignores stale refresh results when a newer refresh supersedes it", async () => {
    let resolveSlow: (value: { success: true; data: TestRow }) => void;
    const slowFetch = new Promise<{ success: true; data: TestRow }>(
      (resolve) => {
        resolveSlow = resolve;
      }
    );
    const fetchById = vi
      .fn()
      .mockReturnValueOnce(slowFetch)
      .mockResolvedValueOnce({
        success: true,
        data: { id: "item-1", title: "Latest" },
      });
    const decryptRow = vi.fn(async (row: TestRow) => ({
      id: row.id,
      title: row.title,
    }));

    const { result } = renderSingleItemHook({ fetchById, decryptRow });

    await waitFor(() => expect(fetchById).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.item?.title).toBe("Latest");
    });

    await act(async () => {
      resolveSlow!({
        success: true,
        data: { id: "item-1", title: "Stale" },
      });
      await Promise.resolve();
    });

    expect(result.current.item?.title).toBe("Latest");
  });

  it("updates via encrypt, mutate, and optimistic patch", async () => {
    const updateEntity = vi.fn().mockResolvedValue({ success: true });
    const { result, options } = renderSingleItemHook({ updateEntity });

    await waitFor(() => expect(result.current.item).not.toBeNull());

    await act(async () => {
      const ok = await result.current.update({ title: "Beta" });
      expect(ok).toBe(true);
    });

    expect(options.encryptUpdate).toHaveBeenCalledWith(
      "item-1",
      { title: "Beta" },
      masterKey
    );
    expect(updateEntity).toHaveBeenCalledWith(
      { id: "item-1", encrypted_title: validEncryptedTitle },
      "test-csrf"
    );
    expect(result.current.item?.title).toBe("Beta");
  });

  it("triggers hard logout when update runs without a master key", async () => {
    const { result } = renderSingleItemHook({
      masterKey: null,
      isUnlocked: true,
    });

    await act(async () => {
      const ok = await result.current.update({ title: "Blocked" });
      expect(ok).toBe(false);
    });

    expect(triggerHardLogoutOnce).toHaveBeenCalledWith(
      "https://helvety.com/tasks/item-1",
      "test-use-single-item"
    );
  });

  it("reports update failures without changing the item", async () => {
    const updateEntity = vi.fn().mockResolvedValue({
      success: false,
      error: "update denied",
    });
    reportE2eeActionFailure.mockReturnValue(false);

    const { result } = renderSingleItemHook({ updateEntity });

    await waitFor(() => expect(result.current.item?.title).toBe("Alpha"));

    await act(async () => {
      const ok = await result.current.update({ title: "Beta" });
      expect(ok).toBe(false);
    });

    expect(result.current.item?.title).toBe("Alpha");
    expect(reportE2eeActionFailure).toHaveBeenCalledWith(
      "update denied",
      expect.objectContaining({
        source: "test-use-single-item",
        fallback: "Failed to update",
      })
    );
  });

  it("deletes via deleteEntity", async () => {
    const deleteEntity = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderSingleItemHook({ deleteEntity });

    await waitFor(() => {
      expect(result.current.item).not.toBeNull();
    });

    await act(async () => {
      await result.current.remove();
    });

    expect(deleteEntity).toHaveBeenCalledWith("item-1", "test-csrf");
    expect(result.current.item).toBeNull();
  });

  it("keeps the item when delete fails", async () => {
    const deleteEntity = vi.fn().mockResolvedValue({
      success: false,
      error: "delete denied",
    });
    reportE2eeActionFailure.mockReturnValue(false);

    const { result } = renderSingleItemHook({ deleteEntity });

    await waitFor(() => expect(result.current.item).not.toBeNull());

    await act(async () => {
      const ok = await result.current.remove();
      expect(ok).toBe(false);
    });

    expect(result.current.item?.title).toBe("Alpha");
    expect(reportE2eeActionFailure).toHaveBeenCalledWith(
      "delete denied",
      expect.objectContaining({
        fallback: "Failed to delete",
      })
    );
  });

  it("shows a toast when remove is called without an id", async () => {
    const { result } = renderSingleItemHook({ id: "" });

    await act(async () => {
      const ok = await result.current.remove();
      expect(ok).toBe(false);
    });

    expect(toastError).toHaveBeenCalledWith("Missing id", expect.any(Object));
  });
});
