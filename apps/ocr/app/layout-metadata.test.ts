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

import { OCR_APP_DESCRIPTION } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("ocr layout metadata", () => {
  it("keeps top-level metadata copy aligned with product copy", () => {
    expect(metadata.description).toBe(OCR_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(OCR_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(OCR_APP_DESCRIPTION);
  });

  it("exposes indexable robots for the public ocr tool", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("uses license-free ocr SEO copy", () => {
    assertLicenseFreeSeoCopy("OCR_APP_DESCRIPTION", OCR_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("OCR_APP_DESCRIPTION", OCR_APP_DESCRIPTION);
    expect(OCR_APP_DESCRIPTION).toMatch(/Extract/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy("OCR_APP_DESCRIPTION", OCR_APP_DESCRIPTION);
  });
});
