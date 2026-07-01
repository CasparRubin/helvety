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

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

import { metadata, NOTES_APP_DESCRIPTION } from "./layout";

describe("notes root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(NOTES_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(NOTES_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(NOTES_APP_DESCRIPTION);
  });

  it("disables indexing for the E2EE notes zone", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("uses license-free encrypted notes SEO copy", () => {
    assertLicenseFreeSeoCopy("NOTES_APP_DESCRIPTION", NOTES_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("NOTES_APP_DESCRIPTION", NOTES_APP_DESCRIPTION);
    expect(NOTES_APP_DESCRIPTION).toMatch(/Encrypted notes/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "NOTES_APP_DESCRIPTION",
      NOTES_APP_DESCRIPTION
    );
  });
});
