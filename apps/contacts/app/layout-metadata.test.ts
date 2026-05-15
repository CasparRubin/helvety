import { assertCustomerCopyStyle } from "@helvety/shared/test-utils/customer-copy-test-helpers";
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

  it("includes AGPL-3.0 in SEO description", () => {
    expect(CONTACTS_APP_DESCRIPTION).toContain("AGPL-3.0-licensed open source");
  });

  it("SEO copy follows customer copy guardrails", () => {
    assertCustomerCopyStyle(
      "CONTACTS_APP_DESCRIPTION",
      CONTACTS_APP_DESCRIPTION
    );
  });
});
