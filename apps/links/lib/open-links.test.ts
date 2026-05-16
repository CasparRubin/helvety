import { afterEach, describe, expect, it, vi } from "vitest";

import { openLinksInNewTabs } from "./open-links";

import type { Link } from "@/lib/types";

/** Minimal link row for open-links tests. */
function makeLink(id: string, url: string): Link {
  return {
    id,
    user_id: "u",
    folder_id: null,
    name: id,
    url,
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  };
}

describe("openLinksInNewTabs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens each link in a new tab with noopener", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);

    openLinksInNewTabs([
      makeLink("a", "https://a.example"),
      makeLink("b", "https://b.example"),
    ]);

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(
      1,
      "https://a.example",
      "_blank",
      "noopener,noreferrer"
    );
    expect(open).toHaveBeenNthCalledWith(
      2,
      "https://b.example",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("does nothing when the list is empty", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);

    openLinksInNewTabs([]);

    expect(open).not.toHaveBeenCalled();
  });
});
