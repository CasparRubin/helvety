import {
  assertLicenseFreeSeoCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Public_Sans: () => ({
    variable: "--font-public-sans",
  }),
}));

vi.mock("@helvety/shared/layout-session-bootstrap", () => ({
  bootstrapAuthLayoutSession: vi.fn().mockResolvedValue({
    csrfToken: "",
    initialUser: null,
  }),
}));

import { AUTH_DESCRIPTION, metadata } from "./layout";

describe("auth root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(AUTH_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(AUTH_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(AUTH_DESCRIPTION);
  });

  it("disables indexing for the sign-in surface", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("uses license-free sign-in SEO copy", () => {
    assertLicenseFreeSeoCopy("AUTH_DESCRIPTION", AUTH_DESCRIPTION);
    assertSwissOriginInSeoCopy("AUTH_DESCRIPTION", AUTH_DESCRIPTION);
    expect(AUTH_DESCRIPTION).toMatch(/passwordless/i);
  });
});
