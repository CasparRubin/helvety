/**
 * Navbar About-dialog product blurbs shared across helvety.com apps. Keep aligned
 * with Store catalog cards and app SEO descriptions. Swiss closing uses
 * `HELVETY_SWISS_ORIGIN_SEO`. Licensing is not repeated here (see legal pages,
 * Store product About sections, and `llms.txt` ## Licensing).
 */

import { HELVETY_SWISS_ORIGIN_SEO } from "./licensing";
import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";

/** E2EE apps: encryption badge tooltip body (Tasks, Contacts, Notes, Links). */
export const E2EE_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content fields are encrypted on your device before storage. Some structural metadata (such as timestamps, relationships, and display preferences) remains plaintext to support app functionality." as const;

export const WEB_NAVBAR_ABOUT =
  "Home base for Helvety on helvety.com. Move between apps, discover tools, and open your account from one place." as const;

export const STORE_NAVBAR_ABOUT =
  "Browse Helvety products, Store downloads, install links, and your account. Listings stay straightforward so you can find what you need quickly." as const;

export const AUTH_NAVBAR_ABOUT =
  "Sign-in for Helvety web apps on helvety.com. One account and shared sessions across those apps." as const;

/** Auth gateway: encryption badge tooltip (login / setup context). */
export const AUTH_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content is encrypted on your device before it leaves your browser. Helvety does not store your decryption keys. In our current architecture, encrypted content is designed to remain unreadable to Helvety during normal operation. Some structural metadata (such as timestamps and display preferences) is stored unencrypted to enable app functionality." as const;

export const TASKS_NAVBAR_ABOUT = `Stage-based tasks with drag-and-drop flow. Titles, descriptions, and dates are encrypted on your device before storage. ${HELVETY_SWISS_ORIGIN_SEO}`;

export const CONTACTS_NAVBAR_ABOUT = `Encrypted contacts with fast lookup and Personal, Work, and Other groups. Names, numbers, and notes are encrypted on your device before storage. ${HELVETY_SWISS_ORIGIN_SEO}`;

export const NOTES_NAVBAR_ABOUT = `Encrypted notes with titles and rich text in Personal, Work, and Other groups. Note content is encrypted on your device before storage. ${HELVETY_SWISS_ORIGIN_SEO}`;

export const LINKS_NAVBAR_ABOUT = `Encrypted bookmarks organized in nested folders you control. Link names and URLs are encrypted on your device before storage. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Navbar About copy for Helvety PDF (optional limit line override). */
export function pdfNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Merge, reorder, rotate, or extract PDF pages in your browser. Supported edits stay local (${fileSizeLimitCopy}). Free to use with fair-use safeguards.`;
}

/** Navbar About copy for Helvety Image Upscaler (optional limit line override). */
export function imageUpscalerNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Upscale PNG, JPEG, and WebP in your browser. Choose 2× or 4× or set a target size. AI runs on your device when supported; otherwise the app uses high-quality resizing. Images are not sent to Helvety for processing (${fileSizeLimitCopy} per file). Switzerland-first service; not actively marketed to EU/EEA users.`;
}

/** Navbar About copy for Helvety Image Editor (optional limit line override). */
export function imageEditorNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Annotate images in your browser with text, arrows, borders, spotlight highlights, blur, and crop. Layers panel and zoom for detail work. Work stays on your device (${fileSizeLimitCopy} per file). No server upload. Switzerland-first service; not actively marketed to EU/EEA users.`;
}
