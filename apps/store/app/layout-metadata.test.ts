import {
  assertLicenseFreeSeoCopy,
  assertLicenseFreeSeoKeywords,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

import { metadata, STORE_DESCRIPTION } from "./layout";

describe("store root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(STORE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(STORE_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(STORE_DESCRIPTION);
  });

  it("exposes indexable robots for the public catalog", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("uses license-free catalog SEO copy and keywords", () => {
    assertLicenseFreeSeoCopy("STORE_DESCRIPTION", STORE_DESCRIPTION);
    assertLicenseFreeSeoKeywords("store metadata.keywords", metadata.keywords);
    assertSwissOriginInSeoCopy("STORE_DESCRIPTION", STORE_DESCRIPTION);
    expect(STORE_DESCRIPTION).toMatch(/Browse free Helvety apps/i);
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(["pdf", "image editor", "ocr"])
    );
    expect(metadata.keywords).not.toEqual(
      expect.arrayContaining([
        "encrypted bookmarks",
        "image upscaler",
        "browser extension",
        "tasks",
        "contacts",
        "notes",
        "links",
      ])
    );
  });
});
