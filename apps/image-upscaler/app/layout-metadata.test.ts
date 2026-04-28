import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

import { IMAGE_UPSCALER_APP_DESCRIPTION_COPY } from "@/lib/product-copy";

import { metadata } from "./layout";

describe("image upscaler layout metadata", () => {
  it("keeps top-level metadata copy aligned with product copy", () => {
    expect(metadata.description).toBe(IMAGE_UPSCALER_APP_DESCRIPTION_COPY);
    expect(metadata.openGraph?.description).toBe(
      IMAGE_UPSCALER_APP_DESCRIPTION_COPY
    );
    expect(metadata.twitter?.description).toBe(
      IMAGE_UPSCALER_APP_DESCRIPTION_COPY
    );
  });
});
