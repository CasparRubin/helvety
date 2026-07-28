import { HELVETY_SWISS_ORIGIN_SEO } from "./licensing";
import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";

/** Default helvety.com marketing blurb (metadata, OG, Twitter, JSON-LD). */
export const WEB_SITE_DESCRIPTION =
  "Software products engineered, designed and made in Switzerland. Private, simple, clean. Browser utilities for PDF, image editor, and OCR tools, extensions, and desktop tools.";

/** Shared store SEO / social copy. */
export const STORE_DESCRIPTION = `Browse free Helvety apps, downloads, and install links. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Store products listing metadata (products wording vs {@link STORE_DESCRIPTION} apps). */
export const STORE_PRODUCTS_PAGE_DESCRIPTION = STORE_DESCRIPTION.replace(
  "apps,",
  "products,"
);

/** Shared PDF SEO / social copy. */
export const PDF_APP_DESCRIPTION = `Reorder, merge, rotate, or extract PDF pages in the tab; add images where supported. Work stays local (${PDF_FILE_SIZE_LIMIT_COPY}). Fair-use safeguards still apply, and no Helvety subscription gates the tools. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for PDF; keep aligned with `ci:check` (`consistency:install-manifest-metadata`). */
export const PDF_PWA_MANIFEST_DESCRIPTION = `Merge, reorder, rotate, or extract PDFs in the tab; supported work stays local. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared image editor SEO / social copy. */
export const IMAGE_EDITOR_APP_DESCRIPTION = `Annotate PNG, JPEG, and WebP in your browser: text, arrows, borders, spotlight highlights, blur regions, and crop, with adjustable stroke, blur, and corner radius plus a layers panel and zoom for detail work (${IMAGE_FILE_SIZE_LIMIT_COPY}). Edits stay on your device with no server-side image processing and no sign-in. Switzerland-first; not offered in the EU/EEA. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for image editor. */
export const IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION = `Annotate PNG, JPEG, and WebP in your browser: text, arrows, borders, spotlight highlights, blur regions, and crop with adjustable corners. Layers panel and zoom; PNG and JPEG export. No account required. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** Shared OCR SEO / social copy. */
export const OCR_APP_DESCRIPTION = `Extract text from PDFs and images in your browser: scanned or photographed pages run through on-device OCR, and born-digital PDFs reuse their existing text layer (${PDF_FILE_SIZE_LIMIT_COPY}). Read, copy, or download plain text with no server-side processing and no sign-in. Switzerland-first; not offered in the EU/EEA. ${HELVETY_SWISS_ORIGIN_SEO}`;

/** PWA `public/manifest.json` summary for OCR. */
export const OCR_PWA_MANIFEST_DESCRIPTION = `Extract text from PDFs and images in your browser with on-device OCR. No account required. ${HELVETY_SWISS_ORIGIN_SEO}`;
