import { describe, expect, it } from "vitest";

import {
  createAppRobots,
  createAppSitemap,
  createPrivateAppRobots,
} from "./seo";

/** Minimal robots rule shape used by helper assertions. */
type RobotsRule = {
  disallow?: string | string[];
};

/** Flattens and deduplicates disallow entries from robots rules. */
function getDisallowedPaths(rules: RobotsRule[]): string[] {
  return [...new Set(rules.flatMap((rule) => rule.disallow ?? []))];
}

describe("seo helpers", () => {
  it("keeps sitemap canonical URLs crawlable for public app configs", () => {
    const appConfigs = [
      {
        appPath: "/store",
        disallowedPaths: ["/account", "/api", "/auth"],
        sitemapPath: "/store/sitemap.xml",
      },
      {
        appPath: "/pdf",
        disallowedPaths: ["/api", "/auth"],
        sitemapPath: "/pdf/sitemap.xml",
      },
    ] as const;

    for (const config of appConfigs) {
      const sitemapEntries = createAppSitemap(config.appPath)();
      const canonicalUrl = sitemapEntries[0]?.url;
      const canonicalPath = new URL(canonicalUrl ?? "").pathname;

      const robots = createAppRobots(
        [...config.disallowedPaths],
        config.sitemapPath
      )();
      const disallowedPaths = getDisallowedPaths(robots.rules as RobotsRule[]);

      expect(disallowedPaths).not.toContain(canonicalPath);
    }
  });

  it("removes self-blocking and duplicate disallow paths", () => {
    const robots = createAppRobots(
      ["/contacts", "/contacts/", "/contacts/sitemap.xml", "/api", "/api"],
      "/contacts/sitemap.xml"
    )();

    const disallowedPaths = getDisallowedPaths(robots.rules as RobotsRule[]);
    expect(disallowedPaths).toEqual(["/api"]);
  });

  it("includes app llms.txt in generated app sitemaps by default", () => {
    const sitemapEntries = createAppSitemap("/pdf")();
    const urls = sitemapEntries.map((entry) => entry.url);

    expect(urls).toContain("https://helvety.com/pdf");
    expect(urls).toContain("https://helvety.com/pdf/llms.txt");
  });

  it("allows disabling llms.txt sitemap entries when needed", () => {
    const sitemapEntries = createAppSitemap("/auth", { includeLlms: false })();
    const urls = sitemapEntries.map((entry) => entry.url);

    expect(urls).toContain("https://helvety.com/auth");
    expect(urls).not.toContain("https://helvety.com/auth/llms.txt");
  });

  it("disallows all crawling for private app robots configs", () => {
    const robots = createPrivateAppRobots("/tasks/sitemap.xml")();
    const disallowedPaths = getDisallowedPaths(robots.rules as RobotsRule[]);

    expect(disallowedPaths).toEqual(["/"]);
    expect(robots.host).toBe("https://helvety.com");
    expect(robots.sitemap).toBe("https://helvety.com/tasks/sitemap.xml");
  });
});
