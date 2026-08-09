import { urls } from "@helvety/shared/config";
import { assertValidPublicSitemapEntries } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

describe("web sitemap", () => {
  it("returns canonical public pages with metadata", () => {
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        urls.home,
        `${urls.home}/impressum`,
        `${urls.home}/privacy`,
        `${urls.home}/terms`,
        `${urls.home}/dpa`,
      ])
    );
    expect(entries).toHaveLength(5);
    assertValidPublicSitemapEntries(entries);
  });
});
