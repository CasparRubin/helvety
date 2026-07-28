/**
 * Navbar About-dialog product blurbs shared across helvety.com apps. Keep aligned
 * with Store catalog cards and app SEO descriptions. Developer attribution,
 * Swiss origin, and generated version information are rendered separately by
 * the shared navbar. Licensing is not repeated here (see legal pages, Store
 * product About sections, and `llms.txt` ## Licensing).
 */

import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";

export const WEB_NAVBAR_ABOUT =
  "Home base for Helvety on helvety.com. Move between apps and discover tools from one place." as const;

export const STORE_NAVBAR_ABOUT =
  "Browse Helvety products, Store downloads, and install links. Listings stay straightforward so you can find what you need quickly." as const;

/** Navbar About copy for Helvety PDF (optional limit line override). */
export function pdfNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Merge, reorder, rotate, extract PDF pages, or add images where supported in your browser. Supported edits stay local (${fileSizeLimitCopy}). Free to use with fair-use safeguards.`;
}

/** Navbar About copy for Helvety Image Editor (optional limit line override). */
export function imageEditorNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Annotate PNG, JPEG, and WebP in your browser with text, arrows, borders, spotlight highlights, blur regions, and crop. Adjust stroke, blur, dim, and corner radius in the tool properties bar; layers panel and zoom for detail work. Work stays on your device (${fileSizeLimitCopy} per file). No server upload.`;
}

/** Navbar About copy for Helvety OCR (optional limit line override). */
export function ocrNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Extract text from PDFs and images in your browser. Scanned or photographed pages run through on-device OCR; born-digital PDFs use their text layer first and fall back to OCR when it is insufficient. Read, copy, or download the plain text. Files stay on your device (${fileSizeLimitCopy}). No server upload.`;
}
