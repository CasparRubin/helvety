import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useE2eeDashboardSelectedEntity } from "./use-e2ee-dashboard-selected-entity";

const reportE2eeHookError = vi.fn().mockReturnValue(false);
const reportE2eeActionFailure = vi.fn().mockReturnValue(false);

vi.mock("./auth-navigation", () => ({
  reportE2eeHookError: (...args: unknown[]) => reportE2eeHookError(...args),
  reportE2eeActionFailure: (...args: unknown[]) =>
    reportE2eeActionFailure(...args),
}));

/** Minimal decrypted entity shape for hook tests. */
type TestEntity = { id: string; title: string };
/** Minimal ciphertext row shape for hook tests. */
type TestRow = { id: string };

const masterKey = {} as CryptoKey;

/** Renders {@link useE2eeDashboardSelectedEntity} with test defaults and overrides. */
function renderSelectedEntity(
  overrides: Partial<
    Parameters<typeof useE2eeDashboardSelectedEntity<TestEntity, TestRow>>[0]
  > = {}
) {
  return renderHook(() =>
    useE2eeDashboardSelectedEntity<TestEntity, TestRow>({
      entityId: null,
      entities: [],
      listIsLoading: false,
      listError: null,
      masterKey,
      isUnlocked: true,
      navigationSource: "test-selected-entity",
      loadFailureMessage: "Failed to load entity",
      fetchById: vi.fn(),
      decryptRow: async (row) => ({ id: row.id, title: "Fetched" }),
      ...overrides,
    })
  );
}

describe("useE2eeDashboardSelectedEntity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { href: "https://helvety.com/tasks" },
      writable: true,
      configurable: true,
    });
  });

  it("returns the in-memory list match without fetching", () => {
    const fetchById = vi.fn();
    const { result } = renderSelectedEntity({
      entityId: "in-list",
      entities: [{ id: "in-list", title: "From list" }],
      fetchById,
    });

    expect(result.current.entity).toEqual({
      id: "in-list",
      title: "From list",
    });
    expect(result.current.isLoadingEntity).toBe(false);
    expect(result.current.entityError).toBeNull();
    expect(fetchById).not.toHaveBeenCalled();
  });

  it("fetches a single row when the id is missing from the list", async () => {
    const fetchById = vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: "fetched" } });
    const { result } = renderSelectedEntity({
      entityId: "fetched",
      fetchById,
    });

    await waitFor(() => {
      expect(result.current.entity?.id).toBe("fetched");
    });
    expect(fetchById).toHaveBeenCalledWith("fetched");
    expect(result.current.isLoadingEntity).toBe(false);
  });

  it("keeps loading while a draft is persisting and not yet in the list", () => {
    const { result } = renderSelectedEntity({
      entityId: "draft-id",
      isPersistingDraft: true,
    });

    expect(result.current.entity).toBeNull();
    expect(result.current.isLoadingEntity).toBe(true);
  });

  it("surfaces fetch errors when single-row load fails", async () => {
    reportE2eeActionFailure.mockReturnValue(false);
    const fetchById = vi
      .fn()
      .mockResolvedValue({ success: false, error: "not found" });
    const { result } = renderSelectedEntity({
      entityId: "missing",
      fetchById,
    });

    await waitFor(() => {
      expect(result.current.entityError).toBe("not found");
    });
    expect(result.current.entity).toBeNull();
    expect(result.current.isLoadingEntity).toBe(false);
  });
});
