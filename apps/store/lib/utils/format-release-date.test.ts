import { describe, expect, it } from "vitest";

import { formatStoreReleaseDate } from "./format-release-date";

describe("formatStoreReleaseDate", () => {
  it("formats YYYY-MM-DD in en-US short month style (UTC)", () => {
    expect(formatStoreReleaseDate("2026-03-15")).toBe("Mar 15, 2026");
  });

  it("returns the input when not three numeric parts", () => {
    expect(formatStoreReleaseDate("")).toBe("");
    expect(formatStoreReleaseDate("nope")).toBe("nope");
  });
});
