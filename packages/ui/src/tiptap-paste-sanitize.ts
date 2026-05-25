import DOMPurify from "dompurify";

/** Allowed link schemes for pasted HTML and Tiptap link marks. */
export const SAFE_LINK_REGEX = /^(https?:\/\/|mailto:|tel:)/i;

/** Sanitize pasted HTML before Tiptap ingests it (DOMPurify + safe link schemes). */
export function sanitizePastedHtmlForEditor(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: SAFE_LINK_REGEX,
  });
}
