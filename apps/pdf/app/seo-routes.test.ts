import { urls } from "@helvety/shared/config";
import {
  assertValidPublicSitemapEntries,
  expectPublicCrawlerRobots,
} from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("pdf SEO routes", () => {
  it("returns crawlable robots with expected disallow rules", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/pdf/api", "/pdf/auth"],
      mustNotDisallow: ["/pdf", "/pdf/sitemap.xml"],
      sitemap: `${urls.home}/pdf/sitemap.xml`,
    });
  });

  it("returns canonical sitemap entries", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe(urls.pdf);
    assertValidPublicSitemapEntries(entries);
  });
});
