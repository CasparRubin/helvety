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

import { IMAGE_EDITOR_APP_DESCRIPTION } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("image editor layout metadata", () => {
  it("keeps top-level metadata copy aligned with product copy", () => {
    expect(metadata.description).toBe(IMAGE_EDITOR_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(IMAGE_EDITOR_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(IMAGE_EDITOR_APP_DESCRIPTION);
  });

  it("exposes indexable robots for the public image editor tool", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("uses license-free image editor SEO copy", () => {
    assertLicenseFreeSeoCopy(
      "IMAGE_EDITOR_APP_DESCRIPTION",
      IMAGE_EDITOR_APP_DESCRIPTION
    );
    assertSwissOriginInSeoCopy(
      "IMAGE_EDITOR_APP_DESCRIPTION",
      IMAGE_EDITOR_APP_DESCRIPTION
    );
    expect(IMAGE_EDITOR_APP_DESCRIPTION).toMatch(/Annotate/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "IMAGE_EDITOR_APP_DESCRIPTION",
      IMAGE_EDITOR_APP_DESCRIPTION
    );
  });
});
