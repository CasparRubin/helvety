import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigationMocks.searchParams,
}));

import { getE2eePanelUrlIntentRef } from "./e2ee-panel-url-intent";
import { useSyncE2eeEntityPanelFromUrl } from "./use-sync-e2ee-entity-panel-from-url";

/** Replaces the mocked `useSearchParams` value for the current test. */
function setSearchParams(query: string) {
  navigationMocks.searchParams = new URLSearchParams(query);
}

describe("useSyncE2eeEntityPanelFromUrl", () => {
  beforeEach(() => {
    navigationMocks.searchParams = new URLSearchParams();
  });

  it("opens entity when URL param is set and panel is closed", () => {
    setSearchParams("note=abc");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: null,
        formMode: null,
        openEntity,
        closePanel,
      })
    );

    expect(openEntity).toHaveBeenCalledWith("abc");
    expect(closePanel).not.toHaveBeenCalled();
  });

  it("does not open when URL id matches current entityId", () => {
    setSearchParams("note=abc");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: "abc",
        formMode: "edit",
        openEntity,
        closePanel,
      })
    );

    expect(openEntity).not.toHaveBeenCalled();
    expect(closePanel).not.toHaveBeenCalled();
  });

  it("skips close while panel is in create mode", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: null,
        formMode: "create",
        openEntity,
        closePanel,
      })
    );

    expect(closePanel).not.toHaveBeenCalled();
  });

  it("skips close while panel URL intent is opening", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    getE2eePanelUrlIntentRef().current = "opening";

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: "abc",
        formMode: "edit",
        openEntity,
        closePanel,
      })
    );

    expect(closePanel).not.toHaveBeenCalled();
    getE2eePanelUrlIntentRef().current = "idle";
  });

  it("skips close while panel URL intent is closing", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    getE2eePanelUrlIntentRef().current = "closing";

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: "abc",
        formMode: "edit",
        openEntity,
        closePanel,
      })
    );

    expect(closePanel).not.toHaveBeenCalled();
    getE2eePanelUrlIntentRef().current = "idle";
  });

  it("closes panel when URL has no param and entity is open", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();
    const onBeforeEntityChange = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: "abc",
        formMode: "edit",
        openEntity,
        closePanel,
        onBeforeEntityChange,
      })
    );

    expect(onBeforeEntityChange).toHaveBeenCalledWith("abc");
    expect(closePanel).toHaveBeenCalled();
    expect(openEntity).not.toHaveBeenCalled();
  });

  it("does not close when URL has no param and panel is already closed", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: null,
        formMode: null,
        openEntity,
        closePanel,
      })
    );

    expect(closePanel).not.toHaveBeenCalled();
    expect(openEntity).not.toHaveBeenCalled();
  });

  it("ignores a different query param key", () => {
    setSearchParams("item=other-id");
    const openEntity = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: null,
        formMode: null,
        openEntity,
        closePanel: vi.fn(),
      })
    );

    expect(openEntity).not.toHaveBeenCalled();
  });

  it("calls onBeforeEntityChange when switching to a different URL entity", () => {
    setSearchParams("note=new-id");
    const openEntity = vi.fn();
    const closePanel = vi.fn();
    const onBeforeEntityChange = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        entityId: "old-id",
        formMode: "edit",
        openEntity,
        closePanel,
        onBeforeEntityChange,
      })
    );

    expect(onBeforeEntityChange).toHaveBeenCalledWith("old-id");
    expect(openEntity).toHaveBeenCalledWith("new-id");
    expect(closePanel).not.toHaveBeenCalled();
  });

  it("reacts to search param changes", () => {
    setSearchParams("");
    const openEntity = vi.fn();
    const closePanel = vi.fn();

    const { rerender } = renderHook(
      ({ entityId }: { entityId: string | null }) =>
        useSyncE2eeEntityPanelFromUrl({
          paramKey: "note",
          entityId,
          formMode: entityId ? "edit" : null,
          openEntity,
          closePanel,
        }),
      { initialProps: { entityId: null as string | null } }
    );

    expect(openEntity).not.toHaveBeenCalled();

    act(() => {
      setSearchParams("note=new-id");
    });
    rerender({ entityId: null });

    expect(openEntity).toHaveBeenCalledWith("new-id");
  });
});
