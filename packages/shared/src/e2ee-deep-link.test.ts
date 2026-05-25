import { describe, expect, it } from "vitest";

import { buildE2eeDeepLink } from "./e2ee-deep-link";

describe("buildE2eeDeepLink", () => {
  it("builds tasks deep links with item query param", () => {
    const url = new URL(buildE2eeDeepLink("tasks", "item-123"));
    expect(url.pathname).toBe("/tasks");
    expect(url.searchParams.get("item")).toBe("item-123");
  });

  it("builds notes deep links with note query param", () => {
    const url = new URL(buildE2eeDeepLink("notes", "note-456"));
    expect(url.pathname).toBe("/notes");
    expect(url.searchParams.get("note")).toBe("note-456");
  });

  it("builds contacts deep links with contact query param", () => {
    const url = new URL(buildE2eeDeepLink("contacts", "contact-789"));
    expect(url.pathname).toBe("/contacts");
    expect(url.searchParams.get("contact")).toBe("contact-789");
  });
});
