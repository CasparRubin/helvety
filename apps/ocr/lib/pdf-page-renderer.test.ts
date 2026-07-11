import { describe, expect, it, vi } from "vitest";

import { OCR_PDF_BASE_DPI, OCR_RENDER_DPI } from "./constants";
import {
  dpiToScale,
  renderPdfPageToImageBlob,
  type PdfRenderPage,
} from "./pdf-page-renderer";

describe("dpiToScale", () => {
  it("returns 1 at the pdf.js base DPI", () => {
    expect(dpiToScale(OCR_PDF_BASE_DPI)).toBe(1);
  });

  it("defaults to the configured render DPI", () => {
    expect(dpiToScale()).toBe(OCR_RENDER_DPI / OCR_PDF_BASE_DPI);
  });
});

describe("renderPdfPageToImageBlob", () => {
  it("aborts before touching the canvas when the signal is already aborted", async () => {
    const page: PdfRenderPage = {
      getViewport: vi.fn(),
      render: vi.fn(),
    };
    const controller = new AbortController();
    controller.abort();

    await expect(
      renderPdfPageToImageBlob(page, { signal: controller.signal })
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(page.getViewport).not.toHaveBeenCalled();
    expect(page.render).not.toHaveBeenCalled();
  });
});
