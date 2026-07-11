import { describe, expect, it } from "vitest";

import { OCR_TEXT_LAYER_MIN_CHARS } from "./constants";
import {
  extractPageTextLayer,
  pageNeedsOcr,
  type PdfTextLayerPage,
} from "./pdf-text-layer";

/** Builds a fake pdf.js page returning the given text-content items. */
function fakePage(
  items: readonly { str?: string; hasEOL?: boolean; type?: string }[]
): PdfTextLayerPage {
  return {
    getTextContent: () => Promise.resolve({ items }),
  };
}

describe("extractPageTextLayer", () => {
  it("concatenates text items and inserts line breaks on EOL", async () => {
    const page = fakePage([
      { str: "Hello" },
      { str: " world", hasEOL: true },
      { str: "next line" },
    ]);
    expect(await extractPageTextLayer(page)).toBe("Hello world\nnext line");
  });

  it("ignores marked-content items without a string", async () => {
    const page = fakePage([{ type: "beginMarkedContent" }, { str: "text" }]);
    expect(await extractPageTextLayer(page)).toBe("text");
  });
});

describe("pageNeedsOcr", () => {
  it("routes near-empty pages to OCR", () => {
    expect(pageNeedsOcr("")).toBe(true);
    expect(pageNeedsOcr("   \n\t  ")).toBe(true);
  });

  it("treats content at or above the threshold as born-digital", () => {
    const atThreshold = "x".repeat(OCR_TEXT_LAYER_MIN_CHARS);
    expect(pageNeedsOcr(atThreshold)).toBe(false);
  });

  it("routes content just below the threshold to OCR", () => {
    const belowThreshold = "x".repeat(OCR_TEXT_LAYER_MIN_CHARS - 1);
    expect(pageNeedsOcr(belowThreshold)).toBe(true);
  });

  it("ignores whitespace when measuring content length", () => {
    const spacedShort = "a b c";
    expect(pageNeedsOcr(spacedShort)).toBe(true);
  });
});
