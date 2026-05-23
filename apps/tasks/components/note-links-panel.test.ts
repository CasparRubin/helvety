import { buildE2eeDeepLink } from "@helvety/shared/e2ee-deep-link";
import { describe, expect, it } from "vitest";

describe("buildE2eeDeepLink (notes from tasks)", () => {
  it("builds a notes deep link with note query parameter", () => {
    const href = buildE2eeDeepLink("notes", "note-123");
    const url = new URL(href);

    expect(url.pathname).toBe("/notes");
    expect(url.searchParams.get("note")).toBe("note-123");
  });
});
