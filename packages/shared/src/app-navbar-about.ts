/**
 * Navbar About-dialog product blurbs shared across helvety.com apps. Keep aligned
 * with Store catalog cards and app SEO descriptions. Developer attribution,
 * Swiss origin, and generated version information are rendered separately by
 * the shared navbar. Licensing is not repeated here (see legal pages, Store
 * product About sections, and `llms.txt` ## Licensing).
 */

import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  OCR_PDF_PAGE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
  PDF_WORKSPACE_LIMITS_COPY,
} from "./product-file-limit-copy";

export const WEB_NAVBAR_ABOUT =
  "Helvety on helvety.com. Open the Store, PDF, Image Editor, or OCR from here." as const;

export const STORE_NAVBAR_ABOUT =
  "Browse Helvety products, Store downloads, and install links." as const;

/** Navbar About copy for Helvety PDF (optional limit line override). */
export function pdfNavbarAbout(
  fileSizeLimitCopy: string = PDF_WORKSPACE_LIMITS_COPY
): string {
  return `Merge, reorder, rotate, or extract PDF pages, and add images, in your browser. Files stay in your browser (${fileSizeLimitCopy}). No account.`;
}

/** Navbar About copy for Helvety Image Editor (optional limit line override). */
export function imageEditorNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Annotate PNG, JPEG, and WebP in your browser with text, arrows, borders, highlights, blur regions, and crop. Adjust stroke, blur, dim, and corner radius. Layers and zoom are included. Work stays on your device (${fileSizeLimitCopy}). No server upload.`;
}

/** Navbar About copy for Helvety OCR (optional limit line override). */
export function ocrNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Extract text from PDFs and images in your browser. Scanned pages use on-device OCR in English or German. Born-digital PDFs use their text layer first, then OCR. Read, copy, or download the plain text. Files stay on your device (${fileSizeLimitCopy}, ${OCR_PDF_PAGE_LIMIT_COPY}). No server upload.`;
}
