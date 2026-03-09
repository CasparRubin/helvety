import { describe, expect, it } from "vitest";

import { getContactDeepLink } from "./contact-links-panel";

describe("getContactDeepLink", () => {
  it("builds a contacts deep link with contact query parameter", () => {
    const href = getContactDeepLink("contact-123");
    const url = new URL(href);

    expect(url.searchParams.get("contact")).toBe("contact-123");
  });
});
