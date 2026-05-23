import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { describe, expect, it } from "vitest";

describe("buildE2eeDeepLink (contacts from tasks)", () => {
  it("builds a contacts deep link with contact query parameter", () => {
    const href = buildE2eeDeepLink("contacts", "contact-123");
    const url = new URL(href);

    expect(url.pathname).toBe("/contacts");
    expect(url.searchParams.get("contact")).toBe("contact-123");
  });
});
