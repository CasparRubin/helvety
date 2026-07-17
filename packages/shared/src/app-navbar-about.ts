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

/** E2EE apps: encryption badge tooltip body (Tasks, Contacts, Notes, Links). */
export const E2EE_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content fields are encrypted on your device before they leave your browser. Record identifiers and some structural metadata remain unencrypted, including timestamps, sort order, categories, stages, labels, priorities, folder relationships, and cross-app relationship identifiers where applicable." as const;

export const WEB_NAVBAR_ABOUT =
  "Home base for Helvety on helvety.com. Move between apps, discover tools, and open your account from one place." as const;

export const STORE_NAVBAR_ABOUT =
  "Browse Helvety products, Store downloads, install links, and your account. Listings stay straightforward so you can find what you need quickly." as const;

export const AUTH_NAVBAR_ABOUT =
  "Sign-in for Helvety web apps on helvety.com. One account and shared sessions across those apps." as const;

/** Auth gateway: encryption badge tooltip (login / setup context). */
export const AUTH_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content fields are encrypted on your device before they leave your browser. Record identifiers and some structural metadata remain unencrypted, including timestamps, sort order, categories, stages, labels, priorities, folder relationships, and cross-app relationship identifiers where applicable. Helvety does not store your decryption keys. In our current architecture, encrypted content is designed to remain unreadable to Helvety during normal operation." as const;

export const TASKS_NAVBAR_ABOUT =
  "Stage-based tasks with drag-and-drop flow. Titles, descriptions, and dates are encrypted on your device before storage." as const;

export const CONTACTS_NAVBAR_ABOUT =
  "Encrypted contacts with fast lookup and Personal, Work, and Other groups. Names, numbers, email addresses, birthdays, descriptions, and notes are encrypted on your device before storage." as const;

export const NOTES_NAVBAR_ABOUT =
  "Encrypted notes with titles and rich text in Personal, Work, and Other groups. Note content is encrypted on your device before storage." as const;

export const LINKS_NAVBAR_ABOUT =
  "Encrypted bookmarks organized in nested folders you control. Link names and URLs are encrypted on your device before storage." as const;

/** Navbar About copy for Helvety PDF (optional limit line override). */
export function pdfNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Merge, reorder, rotate, extract PDF pages, or add images where supported in your browser. Supported edits stay local (${fileSizeLimitCopy}). Free to use with fair-use safeguards.`;
}

/** Navbar About copy for Helvety Image Upscaler (optional limit line override). */
export function imageUpscalerNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Upscale PNG, JPEG, and WebP in your browser. Choose 2× or 4× or set a target size. AI runs on your device when supported; otherwise the app uses high-quality resizing. Images are not sent to Helvety for processing (${fileSizeLimitCopy} per file).`;
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
