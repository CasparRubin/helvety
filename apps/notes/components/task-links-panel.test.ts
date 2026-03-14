import { describe, expect, it } from "vitest";

import { getItemDeepLink } from "./task-links-panel";

describe("getItemDeepLink", () => {
  it("builds a tasks deep link with item query parameter", () => {
    const href = getItemDeepLink("item-123");
    const url = new URL(href);

    expect(url.searchParams.get("item")).toBe("item-123");
  });
});
