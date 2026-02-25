import { describe, expect, it } from "vitest";

import { createAppRobots, createAppSitemap } from "./seo";

/** Minimal robots rule shape used by helper assertions. */
type RobotsRule = {
  disallow?: string | string[];
};

/** Flattens and deduplicates disallow entries from robots rules. */
function getDisallowedPaths(rules: RobotsRule[]): string[] {
  return [...new Set(rules.flatMap((rule) => rule.disallow ?? []))];
}

describe("seo helpers", () => {
  it("keeps sitemap canonical URLs crawlable for all app configs", () => {
    const appConfigs = [
      {
        appPath: "/auth",
        disallowedPaths: ["/api", "/auth/callback"],
        sitemapPath: "/auth/sitemap.xml",
      },
      {
        appPath: "/store",
        disallowedPaths: [
          "/account",
          "/subscriptions",
          "/tenants",
          "/api",
          "/auth",
        ],
        sitemapPath: "/store/sitemap.xml",
      },
      {
        appPath: "/pdf",
        disallowedPaths: ["/api", "/auth"],
        sitemapPath: "/pdf/sitemap.xml",
      },
      {
        appPath: "/tasks",
        disallowedPaths: ["/units", "/api", "/auth"],
        sitemapPath: "/tasks/sitemap.xml",
      },
      {
        appPath: "/contacts",
        disallowedPaths: ["/api", "/auth"],
        sitemapPath: "/contacts/sitemap.xml",
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
});
