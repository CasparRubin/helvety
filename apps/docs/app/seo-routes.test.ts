import { urls } from "@helvety/shared/config";
import { expectPublicCrawlerRobots } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("docs SEO routes", () => {
  it("returns crawlable robots with expected disallow rules", () => {
    expectPublicCrawlerRobots(robots(), {
      disallowPaths: ["/api", "/auth"],
      mustNotDisallow: ["/docs", "/docs/sitemap.xml"],
      sitemap: `${urls.home}/docs/sitemap.xml`,
    });
  });

  it("returns canonical sitemap entries", () => {
    const entries = sitemap();
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: urls.docs }),
        expect.objectContaining({ url: `${urls.docs}/llms.txt` }),
      ])
    );
  });
});
