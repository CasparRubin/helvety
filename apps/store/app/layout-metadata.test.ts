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

  it("states AGPL-3.0 for every product with published source", () => {
    expect(STORE_DESCRIPTION).toContain("AGPL-3.0-licensed open source");
    expect(STORE_DESCRIPTION).toMatch(/Every product with published source/i);
    expect(metadata.keywords).toContain("AGPL-3.0");
  });
});
