import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/tasks",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => navigationMocks.searchParams,
}));

import { useE2eeEntityPanelWithUrl } from "./use-e2ee-entity-panel-with-url";

const ENTITY_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("useE2eeEntityPanelWithUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.pathname = "/tasks";
    navigationMocks.searchParams = new URLSearchParams();
  });

  it("opens the panel and writes the entity id to the URL", () => {
    const { result } = renderHook(() => useE2eeEntityPanelWithUrl("item"));

    act(() => {
      result.current.openEntity(ENTITY_ID);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.entityId).toBe(ENTITY_ID);
    expect(navigationMocks.replace).toHaveBeenCalledWith(
      `/tasks?item=${ENTITY_ID}`,
      { scroll: false }
    );
  });

  it("closes the panel and clears the URL query param", () => {
    navigationMocks.searchParams = new URLSearchParams(`item=${ENTITY_ID}`);
    const { result } = renderHook(() => useE2eeEntityPanelWithUrl("item"));

    act(() => {
      result.current.closePanel();
    });

    expect(result.current.isOpen).toBe(false);
    expect(navigationMocks.replace).toHaveBeenCalledWith("/tasks", {
      scroll: false,
    });
  });

  it("reads legacy query keys on initial open", () => {
    navigationMocks.searchParams = new URLSearchParams(`item=${ENTITY_ID}`);
    const { result } = renderHook(() =>
      useE2eeEntityPanelWithUrl("note", { legacyParamKeys: ["item"] })
    );

    expect(result.current.isOpen).toBe(true);
    expect(result.current.entityId).toBe(ENTITY_ID);
  });

  it("closePanel does not touch the URL when the panel is already closed", () => {
    const { result } = renderHook(() => useE2eeEntityPanelWithUrl("item"));

    act(() => {
      result.current.closePanel();
    });
    act(() => {
      result.current.closePanel();
    });

    expect(result.current.isOpen).toBe(false);
    expect(navigationMocks.replace).not.toHaveBeenCalled();
  });

  it("openEntity does not rewrite the URL when already open with the same id", () => {
    navigationMocks.searchParams = new URLSearchParams(`item=${ENTITY_ID}`);
    const { result } = renderHook(() => useE2eeEntityPanelWithUrl("item"));

    act(() => {
      result.current.openEntity(ENTITY_ID);
    });

    expect(navigationMocks.replace).not.toHaveBeenCalled();
  });

  it("writes the canonical param and drops legacy keys when opening", () => {
    navigationMocks.searchParams = new URLSearchParams(`item=${ENTITY_ID}`);
    const { result } = renderHook(() =>
      useE2eeEntityPanelWithUrl("note", { legacyParamKeys: ["item"] })
    );

    act(() => {
      result.current.openEntity(ENTITY_ID);
    });

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      `/tasks?note=${ENTITY_ID}`,
      { scroll: false }
    );
  });
});
