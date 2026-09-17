import { PDFDocument } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mergePagesOnMainThread,
  mergePartialFailureMessage,
} from "./pdf-merge-pages";

import type { PdfFile, UnifiedPage } from "./types";

const mocks = vi.hoisted(() => ({
  exportPageWithRotation: vi.fn(),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    logUnexpectedError: vi.fn(),
  },
}));

vi.mock("./pdf-rotation", () => ({
  exportPageWithRotation: mocks.exportPageWithRotation,
}));

/** Minimal uploaded PDF fixture used by merge tests. */
function buildPdfFile(): PdfFile {
  return {
    id: "file-1",
    file: new File(["x"], "sample.pdf", { type: "application/pdf" }),
    url: "blob:mock",
    pageCount: 2,
    color: "oklch(0.5 0.1 180)",
    type: "pdf",
  };
}

/** Unified page pointing at `buildPdfFile`. */
function buildUnifiedPage(pageNumber: number): UnifiedPage {
  return {
    id: `file-1-page-${pageNumber}`,
    fileId: "file-1",
    originalPageNumber: pageNumber,
    unifiedPageNumber: pageNumber,
  };
}

describe("mergePartialFailureMessage", () => {
  it("names the skipped page count", () => {
    expect(mergePartialFailureMessage(1)).toBe(
      "1 page(s) could not be included in the download."
    );
    expect(mergePartialFailureMessage(3)).toBe(
      "3 page(s) could not be included in the download."
    );
  });
});

describe("mergePagesOnMainThread", () => {
  beforeEach(() => {
    mocks.exportPageWithRotation.mockReset();
    mocks.exportPageWithRotation.mockResolvedValue(undefined);
  });

  it("keeps a partial blob when one page export fails", async () => {
    const sourcePdf = await PDFDocument.create();
    sourcePdf.addPage([100, 100]);
    sourcePdf.addPage([100, 100]);

    mocks.exportPageWithRotation.mockImplementation(
      async (_target, _source, pageIndex: number) => {
        if (pageIndex === 1) {
          throw new Error("page render exploded");
        }
      }
    );

    const file = buildPdfFile();
    const result = await mergePagesOnMainThread({
      signal: new AbortController().signal,
      activePages: [1, 2],
      currentRotations: {},
      pageMap: new Map([
        [1, buildUnifiedPage(1)],
        [2, buildUnifiedPage(2)],
      ]),
      fileMap: new Map([[file.id, file]]),
      getCachedPdf: async () => sourcePdf,
    });

    expect(result.batchErrors).toHaveLength(1);
    expect(result.batchErrors[0]?.pageNum).toBe(2);
    expect(result.blob.type).toBe("application/pdf");
    expect(result.blob.size).toBeGreaterThan(0);
    expect(mergePartialFailureMessage(result.batchErrors.length)).toBe(
      "1 page(s) could not be included in the download."
    );
  });
});
