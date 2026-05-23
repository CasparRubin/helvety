import { urls } from "@helvety/shared/config";
import { expectPublicCrawlerRobots } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import { getAllProducts } from "@/lib/data/products";

import robots from "./robots";
import sitemap from "./sitemap";

describe("store SEO routes", () => {
  it("returns public robots output without self-blocking entries", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/account", "/api", "/auth"],
      mustNotDisallow: ["/store", "/store/sitemap.xml"],
      sitemap: `${urls.home}/store/sitemap.xml`,
    });
  });

  it("returns public sitemap entries including all product URLs", () => {
    const entries = sitemap();
    const entryUrls = new Set(entries.map((entry) => entry.url));

    expect(entryUrls.has(urls.store)).toBe(true);
    expect(entryUrls.has(`${urls.store}/products`)).toBe(true);
    expect(entryUrls.has(`${urls.store}/llms.txt`)).toBe(true);

    for (const product of getAllProducts()) {
      expect(entryUrls.has(`${urls.store}/products/${product.slug}`)).toBe(
        true
      );
    }
  });
});
