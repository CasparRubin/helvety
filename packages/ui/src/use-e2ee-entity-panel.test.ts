import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useE2eeEntityPanel } from "./use-e2ee-entity-panel";

describe("useE2eeEntityPanel", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.entityId).toBeNull();
    expect(result.current.formMode).toBeNull();
  });

  it("opens entity by id in edit mode", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());
    act(() => {
      result.current.openEntity("abc");
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.formMode).toBe("edit");
    expect(result.current.entityId).toBe("abc");
  });

  it("openCreate opens create mode without an entity id", () => {
    const { result } = renderHook(() => useE2eeEntityPanel());

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.formMode).toBe("create");
    expect(result.current.entityId).toBeNull();
  });

  it("closePanel resets state", () => {
    const { result } = renderHook(() => useE2eeEntityPanel("initial"));
    act(() => {
      result.current.closePanel();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.formMode).toBeNull();
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
