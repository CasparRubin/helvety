import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useE2eeEntityPanel } from "./use-e2ee-entity-panel";

describe("useE2eeEntityPanel", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.entityId).toBeNull();
  });

  it("opens entity by id", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    act(() => {
      result.current.openEntity("abc");
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.entityId).toBe("abc");
  });

  it("openNewDraft opens immediately without background persist when persist is omitted", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    const seedOptimistic = vi.fn();
    const persist = vi.fn();

    act(() => {
      result.current.openNewDraft({
        id: "new-id",
        seedOptimistic,
      });
    });

    expect(seedOptimistic).toHaveBeenCalledWith("new-id");
    expect(result.current.entityId).toBe("new-id");
    expect(result.current.isOpen).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it("openNewDraft opens immediately and persists in background when persist is provided", async () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    const seedOptimistic = vi.fn();
    const persist = vi.fn().mockResolvedValue({ id: "new-id" });

    act(() => {
      result.current.openNewDraft({
        id: "new-id",
        seedOptimistic,
        persist,
      });
    });

    expect(seedOptimistic).toHaveBeenCalledWith("new-id");
    expect(result.current.entityId).toBe("new-id");
    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });
    expect(persist).toHaveBeenCalledWith("new-id");
  });

  it("openNewDraft closes panel when persist fails", async () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    const onPersistFailure = vi.fn();

    act(() => {
      result.current.openNewDraft({
        id: "draft-id",
        seedOptimistic: () => {},
        persist: async () => null,
        onPersistFailure,
      });
    });

    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(onPersistFailure).toHaveBeenCalledWith("draft-id");
    expect(result.current.isOpen).toBe(false);
  });

  it("closePanel resets state", () => {
    const { result } = renderHook(() => useE2eeEntityPanel("initial"));
    act(() => {
      result.current.closePanel();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("openEntity is a no-op when already open with the same id", () => {
    const { result } = renderHook(() => useE2eeEntityPanel("same-id"));
    const panelBefore = result.current.panel;
    act(() => {
      result.current.openEntity("same-id");
    });
    expect(result.current.panel).toBe(panelBefore);
  });

  it("closePanel is a no-op when already closed", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    const panelBefore = result.current.panel;
    act(() => {
      result.current.closePanel();
    });
    expect(result.current.panel).toBe(panelBefore);
  });
});
