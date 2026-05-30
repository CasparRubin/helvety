import { describe, expect, it } from "vitest";

import {
  getRichTextPlainText,
  parseRichTextContent,
  serializeRichTextContent,
} from "./tiptap-utils";

describe("parseRichTextContent", () => {
  it("returns null for null input", () => {
    expect(parseRichTextContent(null)).toBeNull();
  });

  it("returns null for plain text (non-JSON doc)", () => {
    expect(parseRichTextContent("hello")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseRichTextContent("{not json")).toBeNull();
  });

  it("accepts stored JSON doc", () => {
    const raw = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }],
    });
    const doc = parseRichTextContent(raw);
    expect(doc?.type).toBe("doc");
  });

  it("sanitizes stored JSON with a non-doc root that has content", () => {
    const raw = JSON.stringify({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "click",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    });
    const doc = parseRichTextContent(raw);
    expect(doc?.type).toBe("doc");
    const textNode = doc?.content?.[0]?.content?.[0];
    expect(textNode?.marks ?? []).toHaveLength(0);
  });

  it("strips unsafe link marks from stored JSON doc", () => {
    const raw = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });
    const doc = parseRichTextContent(raw);
    const textNode = doc?.content?.[0]?.content?.[0];
    expect(textNode?.marks ?? []).toHaveLength(0);
  });
});

describe("serializeRichTextContent", () => {
  it("round-trips with parseRichTextContent for a doc", () => {
    const doc = parseRichTextContent(
      JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "hi" }],
          },
        ],
      })
    );
    expect(doc).not.toBeNull();
    const serialized = serializeRichTextContent(doc!);
    expect(parseRichTextContent(serialized)).toEqual(doc);
  });

  it("strips unsafe link marks when serializing for storage", () => {
    const serialized = serializeRichTextContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });

    const doc = parseRichTextContent(serialized);
    const textNode = doc?.content?.[0]?.content?.[0];
    expect(textNode?.marks ?? []).toHaveLength(0);
  });
});

describe("getRichTextPlainText", () => {
  it("returns null for null", () => {
    expect(getRichTextPlainText(null)).toBeNull();
  });

  it("returns null for non-doc content", () => {
    expect(getRichTextPlainText("plain")).toBeNull();
  });

  it("extracts text from doc JSON", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "alpha" }],
        },
      ],
    });
    expect(getRichTextPlainText(json)).toBe("alpha");
  });
});
