import { describe, expect, it } from "vitest";

import { getNotesApiPath } from "./use-items";

describe("getNotesApiPath", () => {
  it("prefixes note API routes with the notes base path", () => {
    expect(getNotesApiPath("/api/items")).toBe("/notes/api/items");
    expect(getNotesApiPath("/api/items/abc-123")).toBe(
      "/notes/api/items/abc-123"
    );
  });
});
