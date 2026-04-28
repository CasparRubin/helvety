import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("web SEO routes", () => {
  it("returns crawlable robots output with sitemap index", () => {
    const robotsOutput = robots();

    expect(robotsOutput.rules).toEqual({
      userAgent: "*",
      allow: "/",
    });
    expect(robotsOutput.sitemap).toBe(`${urls.home}/sitemap-index.xml`);
    expect(robotsOutput.host).toBe(urls.home);
  });

  it("returns canonical public sitemap entries", () => {
    const entries = sitemap();
    const entryUrls = entries.map((entry) => entry.url);

    expect(entryUrls).toEqual(
      expect.arrayContaining([
        urls.home,
        `${urls.home}/impressum`,
        `${urls.home}/privacy`,
        `${urls.home}/terms`,
        `${urls.home}/llms.txt`,
      ])
    );
  });
});
