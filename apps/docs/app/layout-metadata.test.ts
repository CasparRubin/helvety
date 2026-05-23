import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

vi.mock("@helvety/shared/layout-session-bootstrap", () => ({
  bootstrapE2eeLayoutSession: vi.fn().mockResolvedValue({
    csrfToken: "test-csrf",
    initialUser: null,
  }),
}));

import { DOCS_APP_DESCRIPTION } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("docs root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(DOCS_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(DOCS_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(DOCS_APP_DESCRIPTION);
  });

  it("exposes indexable robots for the public Docs tool", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("uses license-free Docs tool SEO copy", () => {
    assertLicenseFreeSeoCopy("DOCS_APP_DESCRIPTION", DOCS_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("DOCS_APP_DESCRIPTION", DOCS_APP_DESCRIPTION);
    expect(DOCS_APP_DESCRIPTION).toMatch(/docx/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy("DOCS_APP_DESCRIPTION", DOCS_APP_DESCRIPTION);
  });

  it("metadata keywords describe optional vault, not full-app encryption", () => {
    const keywords = metadata.keywords ?? [];
    expect(keywords).toContain("optional vault save");
    expect(keywords).not.toContain("encrypted documents");
  });
});
