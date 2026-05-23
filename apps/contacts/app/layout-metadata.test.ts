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

import { CONTACTS_APP_DESCRIPTION, metadata } from "./layout";

describe("contacts root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(CONTACTS_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(CONTACTS_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(CONTACTS_APP_DESCRIPTION);
  });

  it("disables indexing for the E2EE contacts zone", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("uses license-free encrypted contacts SEO copy", () => {
    assertLicenseFreeSeoCopy(
      "CONTACTS_APP_DESCRIPTION",
      CONTACTS_APP_DESCRIPTION
    );
    assertSwissOriginInSeoCopy(
      "CONTACTS_APP_DESCRIPTION",
      CONTACTS_APP_DESCRIPTION
    );
    expect(CONTACTS_APP_DESCRIPTION).toMatch(/Encrypted contacts/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "CONTACTS_APP_DESCRIPTION",
      CONTACTS_APP_DESCRIPTION
    );
  });
});
