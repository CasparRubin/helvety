import { describe, expect, it } from "vitest";

import { getNoteDeepLink } from "./note-links-panel";

describe("getNoteDeepLink", () => {
  it("builds a notes deep link with note query parameter", () => {
    const href = getNoteDeepLink("note-456");
    const url = new URL(href);

    expect(url.pathname).toBe("/notes");
    expect(url.searchParams.get("note")).toBe("note-456");
  });
});
