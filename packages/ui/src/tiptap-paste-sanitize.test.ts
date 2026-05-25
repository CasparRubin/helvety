import { describe, expect, it } from "vitest";

import { sanitizePastedHtmlForEditor } from "./tiptap-paste-sanitize";

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
});
