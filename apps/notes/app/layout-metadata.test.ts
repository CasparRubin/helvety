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

  it("includes AGPL-3.0 in SEO description", () => {
    expect(NOTES_APP_DESCRIPTION).toContain("AGPL-3.0-licensed open source");
  });
});
