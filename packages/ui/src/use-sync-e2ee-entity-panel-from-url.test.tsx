import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigationMocks.searchParams,
}));

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
        openEntity,
        closePanel,
      })
    );

    expect(openEntity).not.toHaveBeenCalled();
    expect(closePanel).not.toHaveBeenCalled();
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
        openEntity,
        closePanel,
      })
    );

    expect(closePanel).not.toHaveBeenCalled();
    expect(openEntity).not.toHaveBeenCalled();
  });

  it("reads legacy param keys", () => {
    setSearchParams("item=legacy-id");
    const openEntity = vi.fn();

    renderHook(() =>
      useSyncE2eeEntityPanelFromUrl({
        paramKey: "note",
        legacyParamKeys: ["item"],
        entityId: null,
        openEntity,
        closePanel: vi.fn(),
      })
    );

    expect(openEntity).toHaveBeenCalledWith("legacy-id");
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
        openEntity,
        closePanel,
        onBeforeEntityChange,
      })
    );

    expect(onBeforeEntityChange).toHaveBeenCalledWith("old-id");
    expect(openEntity).toHaveBeenCalledWith("new-id");
    expect(closePanel).not.toHaveBeenCalled();
  });

  it("does not re-run close when legacyParamKeys is a new array with the same contents", () => {
    setSearchParams("");
    const closePanel = vi.fn();

    const { rerender } = renderHook(
      ({ legacyParamKeys }: { legacyParamKeys: string[] }) =>
        useSyncE2eeEntityPanelFromUrl({
          paramKey: "note",
          legacyParamKeys,
          entityId: null,
          openEntity: vi.fn(),
          closePanel,
        }),
      { initialProps: { legacyParamKeys: ["item"] } }
    );

    expect(closePanel).not.toHaveBeenCalled();

    rerender({ legacyParamKeys: ["item"] });
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
