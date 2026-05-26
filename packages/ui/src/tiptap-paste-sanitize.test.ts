import { describe, expect, it } from "vitest";

import {
  sanitizePastedHtmlForEditor,
  sanitizeRichTextJson,
} from "./tiptap-paste-sanitize";

describe("sanitizePastedHtmlForEditor", () => {
  it("removes script tags and event handlers", () => {
    const dirty =
      '<p onclick="alert(1)">Hi</p><script>alert("xss")</script><a href="javascript:evil">x</a>';
    const clean = sanitizePastedHtmlForEditor(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
  });

  it("keeps safe https links", () => {
    const clean = sanitizePastedHtmlForEditor(
      '<a href="https://helvety.com">Helvety</a>'
    );
    expect(clean).toContain('href="https://helvety.com"');
  });

  it("rejects data: and vbscript: in pasted HTML links", () => {
    const clean = sanitizePastedHtmlForEditor(
      '<a href="data:text/html,<script>alert(1)</script>">x</a><a href="vbscript:msgbox(1)">y</a>'
    );
    expect(clean).not.toContain("data:");
    expect(clean).not.toContain("vbscript:");
  });
});

describe("sanitizeRichTextJson", () => {
  it("removes link marks with javascript: href", () => {
    const doc = sanitizeRichTextJson({
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

    const textNode = doc.content?.[0]?.content?.[0];
    expect(textNode?.marks ?? []).toHaveLength(0);
  });

  it("keeps safe https link marks", () => {
    const doc = sanitizeRichTextJson({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Helvety",
              marks: [{ type: "link", attrs: { href: "https://helvety.com" } }],
            },
          ],
        },
      ],
    });

    const textNode = doc.content?.[0]?.content?.[0];
    expect(textNode?.marks?.[0]).toMatchObject({
      type: "link",
      attrs: { href: "https://helvety.com" },
    });
  });
});
