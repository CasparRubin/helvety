import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });
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

  it("passes the OffscreenCanvas to page.render for PDF.js 6", async () => {
    const viewport = { width: 2, height: 2 };
    const render = vi.fn().mockReturnValue({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    });
    const page: PdfRenderPage = {
      getViewport: vi.fn().mockReturnValue(viewport),
      render,
    };

    /** OffscreenCanvas stand-in so the renderer can pass `canvas` into PDF.js 6. */
    class MockOffscreenCanvas {
      constructor(
        public width: number,
        public height: number
      ) {}
      getContext() {
        return {} as OffscreenCanvasRenderingContext2D;
      }
      convertToBlob() {
        return Promise.resolve(new Blob(["png"], { type: "image/png" }));
      }
    }
    vi.stubGlobal("OffscreenCanvas", MockOffscreenCanvas);

    const blob = await renderPdfPageToImageBlob(page);
    expect(blob.type).toBe("image/png");
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        canvas: expect.any(MockOffscreenCanvas),
        viewport,
      })
    );
  });
});
