import { urls } from "@helvety/shared/config";
import { HELVETY_WEB_DEFAULT_TITLE } from "@helvety/shared/licensing";
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

  it("uses the same canonical and Open Graph URL for the gateway home", () => {
    expect(metadata.alternates?.canonical).toBe(urls.home);
    expect(metadata.openGraph?.url).toBe(urls.home);
  });

  it("describes encrypted apps specifically, not vague encrypted productivity", () => {
    expect(WEB_SITE_DESCRIPTION).not.toContain("encrypted productivity");
    expect(WEB_SITE_DESCRIPTION).toMatch(/encrypted task and contact apps/i);
  });

  it("states AGPL-3.0 for all published Helvety source", () => {
    expect(WEB_SITE_DESCRIPTION).toContain("AGPL-3.0-licensed open source");
    expect(WEB_SITE_DESCRIPTION).not.toMatch(/where the repo ships/i);
    expect(metadata.keywords).toContain("AGPL-3.0");
    expect(metadata.keywords).not.toContain("MIT");
  });

  it("uses the shared AGPL-aware default document title", () => {
    expect(metadata.title).toMatchObject({
      default: HELVETY_WEB_DEFAULT_TITLE,
    });
    expect(HELVETY_WEB_DEFAULT_TITLE).toContain("AGPL-3.0");
  });
});
