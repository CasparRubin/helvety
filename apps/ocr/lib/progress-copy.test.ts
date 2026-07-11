import { describe, expect, it } from "vitest";

import { describeOcrProgress } from "./progress-copy";

describe("describeOcrProgress", () => {
  it("labels a single-page (image) job without a page suffix", () => {
    expect(
      describeOcrProgress({ phase: "recognizing", page: 1, totalPages: 1 })
    ).toBe("Recognizing text");
  });

  it("adds a page suffix for multi-page PDFs", () => {
    expect(
      describeOcrProgress({ phase: "recognizing", page: 3, totalPages: 12 })
    ).toBe("Recognizing text — page 3 of 12");
  });

  it("omits the page suffix while the file is still loading", () => {
    expect(
      describeOcrProgress({ phase: "loading", page: 0, totalPages: 0 })
    ).toBe("Loading file");
  });
});
