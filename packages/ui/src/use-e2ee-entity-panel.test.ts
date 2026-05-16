import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

  it("openNewDraft sets entity id on success", async () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    await act(async () => {
      result.current.openNewDraft(async () => ({ id: "new-id" }));
    });
    expect(result.current.entityId).toBe("new-id");
    expect(result.current.isOpen).toBe(true);
  });

  it("openNewDraft leaves panel closed on failure", async () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    await act(async () => {
      result.current.openNewDraft(async () => null);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("closePanel resets state", () => {
    const { result } = renderHook(() => useE2eeEntityPanel("initial"));
    act(() => {
      result.current.closePanel();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
