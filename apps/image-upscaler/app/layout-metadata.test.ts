import { assertNoEmDashInCustomerCopy } from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

vi.mock("@helvety/shared/cached-server", () => ({
  getCachedCSRFToken: vi.fn().mockResolvedValue(""),
  getCachedUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: { logUnexpectedError: vi.fn() },
}));

import { IMAGE_UPSCALER_APP_DESCRIPTION } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("image upscaler layout metadata", () => {
  it("keeps top-level metadata copy aligned with product copy", () => {
    expect(metadata.description).toBe(IMAGE_UPSCALER_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(
      IMAGE_UPSCALER_APP_DESCRIPTION
    );
    expect(metadata.twitter?.description).toBe(IMAGE_UPSCALER_APP_DESCRIPTION);
  });

  it("exposes indexable robots for the public image upscaler tool", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("includes AGPL-3.0 in SEO description", () => {
    expect(IMAGE_UPSCALER_APP_DESCRIPTION).toContain(
      "AGPL-3.0-licensed open source"
    );
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "IMAGE_UPSCALER_APP_DESCRIPTION",
      IMAGE_UPSCALER_APP_DESCRIPTION
    );
  });
});
