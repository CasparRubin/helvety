import { describe, expect, it } from "vitest";

import { getItemDeepLink } from "./task-links-panel";

describe("getItemDeepLink", () => {
  it("builds a tasks deep link with item query parameter", () => {
    const href = getItemDeepLink("item-456");
    const url = new URL(href);

    expect(url.pathname).toBe("/tasks");
    expect(url.searchParams.get("item")).toBe("item-456");
  });
});
