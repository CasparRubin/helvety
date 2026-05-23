/**
 * Navbar About-dialog product blurbs shared across helvety.com apps. Keep aligned
 * with Store catalog cards and app SEO descriptions. Swiss closing uses
 * `HELVETY_SWISS_ORIGIN_SEO`. Licensing is not repeated here (see legal pages,
 * Store product About sections, and `llms.txt` ## Licensing).
 */

import { HELVETY_SWISS_ORIGIN_SEO } from "./licensing";
import {
  DOCS_FILE_SIZE_LIMIT_COPY,
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";

/** Shown at the end of E2EE product About dialogs. */
export const HELVETY_NAVBAR_SWISS_CLOSING = HELVETY_SWISS_ORIGIN_SEO;

/** E2EE apps: encryption badge tooltip body (Tasks, Contacts, Notes, Links). */
export const E2EE_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content fields are encrypted on your device before storage. Some structural metadata (such as timestamps, relationships, and display preferences) remains plaintext to support app functionality." as const;

export const WEB_NAVBAR_ABOUT =
  "Home base for Helvety on helvety.com. Move between apps, discover tools, and open your account from one place." as const;

export const STORE_NAVBAR_ABOUT =
  "Browse Helvety products, downloads, and your account. Listings stay straightforward so you can find what you need quickly." as const;

export const AUTH_NAVBAR_ABOUT =
  "Sign-in for Helvety web apps on helvety.com. One account and shared sessions across those apps." as const;

/** Auth gateway: encryption badge tooltip (login / setup context). */
export const AUTH_NAVBAR_ENCRYPTION_TOOLTIP =
  "Sensitive content is encrypted on your device before it leaves your browser. Helvety does not store your decryption keys. In our current architecture, encrypted content is designed to remain unreadable to Helvety during normal operation. Some structural metadata (such as timestamps and display preferences) is stored unencrypted to enable app functionality." as const;

export const TASKS_NAVBAR_ABOUT = `Stage-based tasks with drag-and-drop flow. Titles, descriptions, and dates are encrypted on your device before storage. ${HELVETY_NAVBAR_SWISS_CLOSING}`;

export const CONTACTS_NAVBAR_ABOUT = `Encrypted contacts with fast lookup and Personal, Work, and Other groups. Names, numbers, and notes are encrypted on your device before storage. ${HELVETY_NAVBAR_SWISS_CLOSING}`;

export const NOTES_NAVBAR_ABOUT = `Encrypted notes with titles and rich text in Personal, Work, and Other groups. Note content is encrypted on your device before storage. ${HELVETY_NAVBAR_SWISS_CLOSING}`;

export const LINKS_NAVBAR_ABOUT = `Encrypted bookmarks organized in nested folders you control. Link names and URLs are encrypted on your device before storage. ${HELVETY_NAVBAR_SWISS_CLOSING}`;

/** Navbar About copy for Helvety PDF (optional limit line override). */
export function pdfNavbarAbout(
  fileSizeLimitCopy: string = PDF_FILE_SIZE_LIMIT_COPY
): string {
  return `Merge, reorder, rotate, or extract PDF pages in your browser. Supported edits stay local (${fileSizeLimitCopy}). Free to use with fair-use safeguards.`;
}

/** Docs vault encryption badge tooltip (optional cloud save). */
export const DOCS_NAVBAR_ENCRYPTION_TOOLTIP =
  "When you save to your vault, document titles and .docx files are encrypted on your device before storage. Editing in the browser without signing in stays local to your device." as const;

/** Navbar About copy for Helvety Docs (optional limit line override). */
export function docsNavbarAbout(
  fileSizeLimitCopy: string = DOCS_FILE_SIZE_LIMIT_COPY
): string {
  return `Edit .docx files in your browser without signing in. Optional vault save encrypts documents on your device (${fileSizeLimitCopy}). Free to use with fair-use safeguards. ${HELVETY_NAVBAR_SWISS_CLOSING}`;
}

/** Navbar About copy for Helvety Image Upscaler (optional limit line override). */
export function imageUpscalerNavbarAbout(
  fileSizeLimitCopy: string = IMAGE_FILE_SIZE_LIMIT_COPY
): string {
  return `Upscale PNG, JPEG, and WebP in your browser. Choose 2× or 4× or set a target size. AI runs on your device when supported; otherwise the app uses high-quality resizing. Images are not sent to Helvety for processing (${fileSizeLimitCopy} per file). Switzerland-first service; not actively marketed to EU/EEA users.`;
}
