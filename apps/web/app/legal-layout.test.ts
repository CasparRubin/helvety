import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const legalCssPath = join(dirname(fileURLToPath(import.meta.url)), "legal.css");
const legalDocumentPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "components",
  "legal-document.tsx"
);

describe("legal layout CSS", () => {
  it("does not force legal sections to full viewport height", () => {
    const css = readFileSync(legalCssPath, "utf8");
    expect(css).not.toContain("min-height: 100vh");
    expect(css).toContain("min-height: 100%");
  });

  it("defines scroll and card table layout primitives", () => {
    const css = readFileSync(legalCssPath, "utf8");
    expect(css).toContain(".legal-table-scroll");
    expect(css).toContain(".legal-table-cards");
    expect(css).toContain("content: attr(data-label)");
  });

  it("prevents the old desktop overflow table behavior", () => {
    const css = readFileSync(legalCssPath, "utf8");
    expect(css).not.toContain("width: max-content");
    expect(css).toContain('.legal-table-scroll [data-slot="table"]');
    expect(css).toContain("width: 100%");
    expect(css).toContain("table-layout: fixed");
    expect(css).toContain("white-space: normal");
  });

  it("adds anchor-offset and keyboard-focus affordances", () => {
    const css = readFileSync(legalCssPath, "utf8");
    expect(css).toContain("scroll-margin-top: 6rem");
    expect(css).toContain(".legal-table-wrap:focus-visible");
    expect(css).toContain(".legal-toc a:focus-visible");
  });
});

describe("LegalPageShell height", () => {
  it("fills the scroll main without exceeding it", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('className="legal-page-section min-h-full"');
  });
});
