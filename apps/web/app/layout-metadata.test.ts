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

import { metadata, WEB_SITE_DESCRIPTION } from "./layout";

describe("web root layout metadata", () => {
  it("keeps description aligned across metadata, Open Graph, and Twitter", () => {
    expect(metadata.description).toBe(WEB_SITE_DESCRIPTION);
    expect(metadata.openGraph?.description).toBe(WEB_SITE_DESCRIPTION);
    expect(metadata.twitter?.description).toBe(WEB_SITE_DESCRIPTION);
  });

  it("exposes indexable robots for the marketing gateway", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });
});
