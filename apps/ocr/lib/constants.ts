/** OCR zone constants: limits, rendering, and worker configuration. */

/** Maximum accepted file size (PDF or image), in bytes. Matches the PDF zone. */
export const OCR_FILE_SIZE_LIMIT_BYTES = 100 * 1024 * 1024;

/** Maximum number of pages processed from a single PDF. */
export const OCR_MAX_PDF_PAGES = 50;

/** Accepted image MIME types (stricter than the PDF zone's broad `image/*`). */
export const OCR_ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Accepted PDF MIME type. */
export const OCR_PDF_MIME_TYPE = "application/pdf";

/** `accept` attribute for the hidden file input (single file, no `multiple`). */
export const OCR_FILE_INPUT_ACCEPT = `${OCR_PDF_MIME_TYPE},${OCR_ACCEPTED_IMAGE_MIME_TYPES.join(",")}`;

/** Rendering resolution for rasterizing PDF pages before OCR (dots per inch). */
export const OCR_RENDER_DPI = 175;

/** Base CSS resolution pdf.js assumes for a viewport at scale 1. */
export const OCR_PDF_BASE_DPI = 72;

/**
 * Born-digital heuristic: a PDF page with fewer normalized text characters than
 * this is treated as image-only and routed through OCR.
 */
export const OCR_TEXT_LAYER_MIN_CHARS = 20;

/** Public path to the pdf.js worker (synced from react-pdf's pdfjs-dist). */
export const OCR_PDF_WORKER_PUBLIC_PATH = "/ocr/pdf.worker.min.mjs";

/** Public directory that hosts the Tesseract `*.traineddata` language files. */
export const OCR_TESSDATA_PUBLIC_PATH = "/ocr/tessdata";

/** Public directory hosting the self-hosted Tesseract worker + core WASM. */
export const OCR_TESSERACT_ASSETS_PUBLIC_PATH = "/ocr/tesseract";

/** Wall-clock timeout for a single page recognition (matches image-upscaler). */
export const OCR_WORKER_OPERATION_TIMEOUT_MS = 180_000;

/** Page separator used when concatenating multi-page PDF output. */
export const OCR_PAGE_SEPARATOR_TEMPLATE = "\n\n--- Page {page} ---\n\n";

/** Filename constraints for the downloaded `.txt` file. */
export const OCR_FILENAME_LIMITS = {
  MAX_LENGTH: 200,
  DEFAULT_NAME: "extracted-text",
} as const;
