import { OCR_PDF_BASE_DPI, OCR_RENDER_DPI } from "./constants";

/** Minimal shape of a pdf.js viewport. */
interface PdfViewport {
  readonly width: number;
  readonly height: number;
}

/** Minimal shape of a pdf.js render task. */
interface PdfRenderTask {
  readonly promise: Promise<void>;
  cancel(): void;
}

/** Minimal shape of the pdf.js page proxy needed for rasterization. */
export interface PdfRenderPage {
  getViewport(params: { scale: number }): PdfViewport;
  render(params: {
    canvasContext: OffscreenCanvasRenderingContext2D;
    viewport: PdfViewport;
  }): PdfRenderTask;
}

/** Converts a target DPI to a pdf.js viewport scale factor. */
export function dpiToScale(dpi: number = OCR_RENDER_DPI): number {
  return dpi / OCR_PDF_BASE_DPI;
}

/** Throws an `AbortError` if the signal has already been aborted. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("PDF page rendering aborted", "AbortError");
  }
}

/**
 * Rasterizes a PDF page to a PNG `Blob` at the given DPI so it can be handed to
 * the OCR worker. Rendering is cancelled if the signal aborts. A `Blob` is used
 * (rather than an `ImageBitmap`) because Tesseract.js accepts it directly.
 */
export async function renderPdfPageToImageBlob(
  page: PdfRenderPage,
  options: { dpi?: number; signal?: AbortSignal } = {}
): Promise<Blob> {
  throwIfAborted(options.signal);

  const viewport = page.getViewport({ scale: dpiToScale(options.dpi) });
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.ceil(viewport.width)),
    Math.max(1, Math.ceil(viewport.height))
  );
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas is not available in this browser.");
  }

  const task = page.render({ canvasContext: context, viewport });

  const onAbort = (): void => task.cancel();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await task.promise;
  } finally {
    options.signal?.removeEventListener("abort", onAbort);
  }

  throwIfAborted(options.signal);
  return canvas.convertToBlob({ type: "image/png" });
}
