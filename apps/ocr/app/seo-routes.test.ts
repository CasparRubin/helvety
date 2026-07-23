import { urls } from "@helvety/shared/config";
import {
  assertValidPublicSitemapEntries,
  expectPublicCrawlerRobots,
} from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("ocr SEO routes", () => {
  it("returns crawlable robots with expected disallow rules", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/ocr/api", "/ocr/auth"],
      mustNotDisallow: ["/ocr", "/ocr/sitemap.xml"],
      sitemap: `${urls.home}/ocr/sitemap.xml`,
    });
  });

  it("returns canonical sitemap entries", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe(urls.ocr);
    assertValidPublicSitemapEntries(entries);
  });
});
