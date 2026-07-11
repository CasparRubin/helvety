import { describe, expect, it } from "vitest";

import { createOcrDownloadName } from "./file-download";

describe("createOcrDownloadName", () => {
  it("replaces the source extension with -ocr.txt", () => {
    expect(createOcrDownloadName("report.pdf")).toBe("report-ocr.txt");
    expect(createOcrDownloadName("scan.png")).toBe("scan-ocr.txt");
  });

  it("handles names without an extension", () => {
    expect(createOcrDownloadName("scan")).toBe("scan-ocr.txt");
  });

  it("falls back to the default base for empty names", () => {
    expect(createOcrDownloadName("")).toBe("extracted-text-ocr.txt");
    expect(createOcrDownloadName("   ")).toBe("extracted-text-ocr.txt");
  });

  it("preserves dot-prefixed extensions as the base name", () => {
    expect(createOcrDownloadName(".pdf")).toBe(".pdf-ocr.txt");
  });
});
