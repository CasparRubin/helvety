/**
 * Lightweight rich-text utility functions.
 * Separated from tiptap-editor.tsx so consumers that only need
 * parse / serialize don't pull in the full Tiptap editor bundle.
 */

/** Minimal ProseMirror JSON node shape (compatible with @tiptap/core JSONContent) */
export interface JSONContent {
  type?: string;
  content?: JSONContent[];
  text?: string;
  [key: string]: unknown;
}

/**
 * Parse rich text content - handles both JSON and legacy plain text
 */
export function parseRichTextContent(
  content: string | null
): JSONContent | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: content }] },
      ],
    };
  } catch {
    return {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: content }] },
      ],
    };
  }
}

/**
 * Serialize rich text content to string for storage
 */
export function serializeRichTextContent(content: JSONContent): string {
  return JSON.stringify(content);
}

/**
 * Extract plain text from rich text content (handles both JSON and legacy plain text)
 */
export function getRichTextPlainText(content: string | null): string | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      const extractText = (node: Record<string, unknown>): string => {
        if (node.type === "text") return (node.text as string) || "";
        if (node.content && Array.isArray(node.content)) {
          return (node.content as Record<string, unknown>[])
            .map(extractText)
            .join("");
        }
        return "";
      };
      const text = extractText(parsed);
      return text || null;
    }
    return content;
  } catch {
    return content;
  }
}
