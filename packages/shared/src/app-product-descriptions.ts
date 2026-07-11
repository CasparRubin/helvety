import {
  HELVETY_SWISS_BUILT_SUFFIX,
  HELVETY_SWISS_ORIGIN_SEO,
} from "./licensing";
import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";

/** Default helvety.com marketing blurb (metadata, OG, Twitter, JSON-LD). */
export const WEB_SITE_DESCRIPTION =
  "Software products engineered, designed and made in Switzerland. Private, simple, clean. Encrypted task, contact, note, and link apps, browser utilities for PDF, image upscaler, image editor, and OCR tools, extensions, and desktop tools.";

/** Shared auth SEO / social copy. */
export const AUTH_DESCRIPTION = `Passwordless entry for Helvety apps: email verification and passkeys; returning browsers may skip re-entering email after device verification. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shorter auth PWA install line; must match `public/manifest.json`. */
export const AUTH_PWA_MANIFEST_DESCRIPTION = `Passwordless Helvety sign-in: OTP and passkeys for encrypted apps. ${HELVETY_SWISS_BUILT_SUFFIX}`;

/** Shared store SEO / social copy. */
export const STORE_DESCRIPTION = `Browse free Helvety apps, downloads, and install links. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared contacts SEO / social copy. */
export const CONTACTS_APP_DESCRIPTION = `Encrypted contacts with names, numbers, birthdays, and notes. Personal, Work, and Other groups. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared notes SEO / social copy. */
export const NOTES_APP_DESCRIPTION = `Encrypted notes with titles and rich text in Personal, Work, and Other groups. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared tasks SEO / social copy. */
export const TASKS_APP_DESCRIPTION = `Stage-based tasks with encrypted titles, descriptions, and dates. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared links SEO / social copy. */
export const LINKS_APP_DESCRIPTION = `Encrypted bookmarks with nested folders. Names and URLs are encrypted on your device before storage. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Store products listing metadata (products wording vs {@link STORE_DESCRIPTION} apps). */
export const STORE_PRODUCTS_PAGE_DESCRIPTION = STORE_DESCRIPTION.replace(
  "apps,",
  "products,"
);

/** Shared PDF SEO / social copy. */
export const PDF_APP_DESCRIPTION = `Reorder, merge, rotate, or extract PDF pages in the tab; add images where supported. Work stays local (${PDF_FILE_SIZE_LIMIT_COPY}). Fair-use safeguards still apply, and no Helvety subscription gates the tools. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for PDF; keep aligned with `ci:check` (`consistency:install-manifest-metadata`). */
export const PDF_PWA_MANIFEST_DESCRIPTION = `Merge, reorder, rotate, or extract PDFs in the tab; supported work stays local. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared image upscaler SEO / social copy. */
export const IMAGE_UPSCALER_APP_DESCRIPTION = `Upscale PNG, JPEG, and WebP in your browser with on-device AI when supported, plus an automatic high-quality resize fallback (${IMAGE_FILE_SIZE_LIMIT_COPY}). Batches up to five files, no server-side image processing and no sign-in. Switzerland-first service posture (not actively targeted to EU/EEA markets). ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for image upscaler. */
export const IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION = `Upscale images in your browser with AI when supported. No account required. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared image editor SEO / social copy. */
export const IMAGE_EDITOR_APP_DESCRIPTION = `Annotate PNG, JPEG, and WebP in your browser: text, arrows, borders, spotlight highlights, blur regions, and crop, with adjustable stroke, blur, and corner radius plus a layers panel and zoom for detail work (${IMAGE_FILE_SIZE_LIMIT_COPY}). Edits stay on your device with no server-side image processing and no sign-in. Switzerland-first service posture (not actively targeted to EU/EEA markets). ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for image editor. */
export const IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION = `Annotate PNG, JPEG, and WebP in your browser: text, arrows, borders, spotlight highlights, blur regions, and crop with adjustable corners. Layers panel and zoom; PNG and JPEG export. No account required. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared OCR SEO / social copy. */
export const OCR_APP_DESCRIPTION = `Extract text from PDFs and images in your browser: scanned or photographed pages run through on-device OCR, and born-digital PDFs reuse their existing text layer (${PDF_FILE_SIZE_LIMIT_COPY}). Read, copy, or download plain text with no server-side processing and no sign-in. Switzerland-first service posture (not actively targeted to EU/EEA markets). ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for OCR. */
export const OCR_PWA_MANIFEST_DESCRIPTION = `Extract text from PDFs and images in your browser with on-device OCR. No account required. ${HELVETY_SWISS_ORIGIN_SEO}`;
