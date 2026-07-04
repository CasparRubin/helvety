import { urls } from "@helvety/shared/config";
import {
  assertValidPublicSitemapEntries,
  expectPublicCrawlerRobots,
} from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("image editor SEO routes", () => {
  it("returns crawlable robots with expected disallow rules", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/api", "/auth"],
      mustNotDisallow: ["/image-editor", "/image-editor/sitemap.xml"],
      sitemap: `${urls.home}/image-editor/sitemap.xml`,
    });
  });

  it("returns canonical sitemap entries", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe(urls.imageEditor);
    assertValidPublicSitemapEntries(entries);
  });
});
