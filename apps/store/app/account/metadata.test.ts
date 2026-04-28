import { describe, expect, it } from "vitest";

import { metadata } from "./page";

describe("store account metadata", () => {
  it("marks account pages as non-indexable", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });
});
