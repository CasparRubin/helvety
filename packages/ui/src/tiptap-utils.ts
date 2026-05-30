import { sanitizeRichTextJson } from "./tiptap-paste-sanitize";

import type { JSONContent } from "@tiptap/react";

/**
 * Lightweight rich-text utility functions.
 * Separated from tiptap-editor.tsx so consumers that only need
 * parse / serialize don't pull in the full Tiptap editor bundle.
 */

export type { JSONContent };

/** True when parsed JSON is a Tiptap doc or doc-like root node. */
function isRichTextDoc(value: unknown): value is JSONContent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const json = value as JSONContent;
  return (
    json.type === "doc" ||
    (typeof json.type === "string" && Array.isArray(json.content))
  );
}

/** Parse stored rich text JSON into a Tiptap doc, or null when empty/invalid. */
export function parseRichTextContent(
  content: string | null
): JSONContent | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as unknown;
    if (isRichTextDoc(parsed)) {
      return sanitizeRichTextJson(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

/** Serialize rich text content to string for storage. */
export function serializeRichTextContent(content: JSONContent): string {
  return JSON.stringify(sanitizeRichTextJson(content));
}

/** Extract plain text from stored rich text JSON. */
export function getRichTextPlainText(content: string | null): string | null {
  if (!content) return null;

  const doc = parseRichTextContent(content);
  if (!doc) return null;

  const extractText = (node: Record<string, unknown>): string => {
    if (node.type === "text") return (node.text as string) || "";
    if (node.content && Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[])
        .map(extractText)
        .join("");
    }
    return "";
  };

  const text = extractText(doc);
  return text || null;
}
