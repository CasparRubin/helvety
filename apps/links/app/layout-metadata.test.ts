import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

import { metadata, LINKS_APP_DESCRIPTION } from "./layout";

describe("links root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(LINKS_APP_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(LINKS_APP_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(LINKS_APP_DESCRIPTION);
  });

  it("disables indexing for the E2EE links zone", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("uses license-free encrypted links SEO copy", () => {
    assertLicenseFreeSeoCopy("LINKS_APP_DESCRIPTION", LINKS_APP_DESCRIPTION);
    assertSwissOriginInSeoCopy("LINKS_APP_DESCRIPTION", LINKS_APP_DESCRIPTION);
    expect(LINKS_APP_DESCRIPTION).toMatch(/Encrypted bookmarks/i);
  });

  it("SEO copy contains no em-dash", () => {
    assertNoEmDashInCustomerCopy(
      "LINKS_APP_DESCRIPTION",
      LINKS_APP_DESCRIPTION
    );
  });

  it("keeps PWA manifest description aligned with layout metadata", () => {
    const manifestPath = resolve(process.cwd(), "public/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      description?: string;
    };

    expect(manifest.description).toBe(LINKS_APP_DESCRIPTION);
  });
});
