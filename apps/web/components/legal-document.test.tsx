import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const legalDocumentPath = join(webRoot, "components", "legal-document.tsx");

describe("LegalTableWrap", () => {
  it("keeps the shared scroll region accessible", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('role="region"');
    expect(src).toContain("aria-label={ariaLabel}");
    expect(src).toContain("tabIndex={0}");
    expect(src).toContain('"legal-table-wrap"');
  });
});

describe("LegalTable", () => {
  it("applies scroll layout class for provider tables", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('"legal-table-scroll"');
  });

  it("applies card layout class for wide tables", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('"legal-table-cards"');
  });
});

describe("LegalToc", () => {
  it("renders a named navigation landmark", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain('aria-label="Table of contents"');
    expect(src).toContain('"legal-toc"');
  });
});

describe("LegalPageShell", () => {
  it("server-renders the shared legal section shell", () => {
    const src = readFileSync(legalDocumentPath, "utf8");
    expect(src).toContain("LegalPageShell");
    expect(src).toContain("LegalTableWrap");
  });
});
