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
});

describe("LegalPageShell height", () => {
  it("fills the scroll main without exceeding it", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('className="legal-page-section min-h-full"');
  });
});
