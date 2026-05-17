import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/links",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace }),
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => navigationMocks.searchParams,
}));

import { useLinksPanelUrlSync } from "./use-links-panel-url";

const LINK_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const FOLDER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("useLinksPanelUrlSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.searchParams = new URLSearchParams();
  });

  it("reads an open link panel from ?link=", () => {
    navigationMocks.searchParams = new URLSearchParams(`link=${LINK_ID}`);
    const { result } = renderHook(() => useLinksPanelUrlSync());

    expect(result.current.readPanelFromUrl()).toEqual({
      mode: "open",
      kind: "link",
      id: LINK_ID,
    });
  });

  it("reads an open folder panel from ?folder=", () => {
    navigationMocks.searchParams = new URLSearchParams(`folder=${FOLDER_ID}`);
    const { result } = renderHook(() => useLinksPanelUrlSync());

    expect(result.current.readPanelFromUrl()).toEqual({
      mode: "open",
      kind: "folder",
      id: FOLDER_ID,
    });
  });

  it("writes link panels to ?link= and drops folder params", () => {
    navigationMocks.searchParams = new URLSearchParams(
      `folder=${FOLDER_ID}&view=tree`
    );
    const { result } = renderHook(() => useLinksPanelUrlSync());

    result.current.writePanelToUrl({ mode: "open", kind: "link", id: LINK_ID });

    expect(navigationMocks.replace).toHaveBeenCalledWith(
      `/links?view=tree&link=${LINK_ID}`,
      { scroll: false }
    );
  });

  it("clears link and folder params when closing", () => {
    navigationMocks.searchParams = new URLSearchParams(
      `link=${LINK_ID}&folder=${FOLDER_ID}`
    );
    const { result } = renderHook(() => useLinksPanelUrlSync());

    result.current.writePanelToUrl({ mode: "closed" });

    expect(navigationMocks.replace).toHaveBeenCalledWith("/links", {
      scroll: false,
    });
  });
});
