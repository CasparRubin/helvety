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
  bootstrapPublicLayoutUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: vi.fn() },
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

import { PDF_APP_DESCRIPTION } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("pdf root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(PDF_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(PDF_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(PDF_APP_DESCRIPTION);
  });

  it("exposes indexable robots for the public PDF tool", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("uses merge/extract verbs in SEO copy, not retired stitch/carve wording", () => {
    expect(PDF_APP_DESCRIPTION).toMatch(/merge/i);
    expect(PDF_APP_DESCRIPTION).toMatch(/extract/i);
    expect(PDF_APP_DESCRIPTION.toLowerCase()).not.toContain("stitch");
    expect(PDF_APP_DESCRIPTION.toLowerCase()).not.toContain("carve");
  });

  it("uses license-free PDF tool SEO copy", () => {
    assertLicenseFreeSeoCopy("PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION);
    expect(PDF_APP_DESCRIPTION).toMatch(/PDF pages/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy("PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION);
  });
});
