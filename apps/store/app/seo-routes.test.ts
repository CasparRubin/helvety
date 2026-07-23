import { urls } from "@helvety/shared/config";
import { getStoreCatalogNewestFirst } from "@helvety/shared/store-catalog";
import {
  assertValidPublicSitemapEntries,
  expectPublicCrawlerRobots,
} from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/product-catalog-cache", () => ({
  getCachedStoreCatalogCards: async () => getStoreCatalogNewestFirst(),
}));

import robots from "./robots";
import sitemap from "./sitemap";

describe("store SEO routes", () => {
  it("returns public robots output without self-blocking entries", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/store/account", "/store/api", "/store/auth"],
      mustNotDisallow: ["/store", "/store/sitemap.xml"],
      sitemap: `${urls.home}/store/sitemap.xml`,
    });
  });

  it("returns public sitemap entries including all product URLs", async () => {
    const entries = await sitemap();
    const entryUrls = new Set(entries.map((entry) => entry.url));

    expect(entryUrls.has(urls.store)).toBe(true);
    expect(entryUrls.has(`${urls.store}/products`)).toBe(true);
    expect(entryUrls.has(`${urls.store}/llms.txt`)).toBe(false);

    for (const card of getStoreCatalogNewestFirst()) {
      expect(entryUrls.has(`${urls.store}/products/${card.slug}`)).toBe(true);
    }

    assertValidPublicSitemapEntries(entries);
  });
});
