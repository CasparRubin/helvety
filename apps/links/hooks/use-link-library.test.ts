import { describe, expect, it } from "vitest";

import { getLinksApiPath } from "./use-link-library";

describe("getLinksApiPath", () => {
  it("prefixes library API routes with the links base path", () => {
    expect(getLinksApiPath("/api/library")).toBe("/links/api/library");
  });
});
