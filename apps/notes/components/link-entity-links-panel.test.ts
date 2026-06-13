import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { describe, expect, it } from "vitest";

describe("buildE2eeDeepLink (links from notes)", () => {
  it("builds a links deep link with link query parameter", () => {
    const href = buildE2eeDeepLink("links", "link-456");
    const url = new URL(href);

    expect(url.pathname).toBe("/links");
    expect(url.searchParams.get("link")).toBe("link-456");
  });
});
