import DOMPurify from "dompurify";

import type { JSONContent } from "@tiptap/react";

/** Allowed link schemes for pasted HTML and Tiptap link marks. */
export const SAFE_LINK_REGEX = /^(https?:\/\/|mailto:|tel:)/i;

/** Sanitize pasted HTML before Tiptap ingests it (DOMPurify + safe link schemes). */
export function sanitizePastedHtmlForEditor(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: SAFE_LINK_REGEX,
  });
}

/** True when `href` is a non-empty string matching {@link SAFE_LINK_REGEX}. */
function isSafeLinkHref(href: unknown): href is string {
  return typeof href === "string" && SAFE_LINK_REGEX.test(href);
}

/** Recursively strips unsafe link marks from a ProseMirror JSON node tree. */
function sanitizeRichTextNode(node: JSONContent): JSONContent {
  const sanitized: JSONContent = { ...node };

  if (Array.isArray(sanitized.marks)) {
    sanitized.marks = sanitized.marks
      .map((mark) => {
        if (
          mark &&
          typeof mark === "object" &&
          mark.type === "link" &&
          mark.attrs &&
          typeof mark.attrs === "object"
        ) {
          const href = (mark.attrs as { href?: unknown }).href;
          if (!isSafeLinkHref(href)) {
            return null;
          }
        }
        return mark;
      })
      .filter(
        (mark): mark is NonNullable<JSONContent["marks"]>[number] =>
          mark !== null
      );
  }

  if (Array.isArray(sanitized.content)) {
    sanitized.content = sanitized.content.map((child) =>
      sanitizeRichTextNode(child)
    );
  }

  return sanitized;
}

/** Normalizes any ProseMirror JSON root into a sanitized `doc` tree. */
function asSanitizedDocRoot(node: JSONContent): JSONContent {
  if (node.type === "doc") {
    return sanitizeRichTextNode(node);
  }
  if (Array.isArray(node.content)) {
    return {
      type: "doc",
      content: node.content.map((child) => sanitizeRichTextNode(child)),
    };
  }
  return {
    type: "doc",
    content: [sanitizeRichTextNode(node)],
  };
}

/** Strip unsafe link `href` values from stored ProseMirror JSON before render or persist. */
export function sanitizeRichTextJson(doc: JSONContent): JSONContent {
  return asSanitizedDocRoot(doc);
}
