import { describe, expect, it } from "vitest";

import { AI_DISCOVERY_USER_AGENTS } from "../seo";

import {
  assertValidPublicSitemapEntries,
  expectPrivateZoneRobots,
  expectPublicCrawlerRobots,
  normalizeRobotsRules,
} from "./seo-route-test-helpers";

describe("seo-route-test-helpers", () => {
  it("normalizes single and array robots rules", () => {
    expect(
      normalizeRobotsRules({
        rules: { userAgent: "*", allow: "/" },
      })
    ).toHaveLength(1);
    expect(
      normalizeRobotsRules({
        rules: [
          { userAgent: "*", allow: "/" },
          { userAgent: "GPTBot", allow: "/" },
        ],
      })
    ).toHaveLength(2);
  });

  it("expectPublicCrawlerRobots requires AI agents to mirror the star rule", () => {
    const robotsOutput = {
      rules: [
        { userAgent: "*", allow: "/", disallow: ["/pdf/api"] },
        ...AI_DISCOVERY_USER_AGENTS.map((userAgent) => ({
          userAgent,
          allow: "/",
          disallow: ["/pdf/api"],
        })),
      ],
      sitemap: "https://helvety.com/pdf/sitemap.xml",
    };

    expect(() =>
      expectPublicCrawlerRobots(robotsOutput, {
        disallowPaths: ["/pdf/api"],
        sitemap: "https://helvety.com/pdf/sitemap.xml",
      })
    ).not.toThrow();
  });

  it("assertValidPublicSitemapEntries rejects llms.txt and ignored tags", () => {
    expect(() =>
      assertValidPublicSitemapEntries([
        {
          url: "https://helvety.com/pdf",
          lastModified: new Date(),
        },
      ])
    ).not.toThrow();

    expect(() =>
      assertValidPublicSitemapEntries([
        {
          url: "https://helvety.com/pdf/llms.txt",
          lastModified: new Date(),
        },
      ])
    ).toThrow();

    expect(() =>
      assertValidPublicSitemapEntries([
        {
          url: "https://helvety.com/pdf",
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 1,
        },
      ])
    ).toThrow();
  });

  it("expectPrivateZoneRobots requires zone-prefix disallow and no sitemap", () => {
    expect(() =>
      expectPrivateZoneRobots(
        {
          rules: [{ userAgent: "*", disallow: "/tasks" }],
        },
        "/tasks"
      )
    ).toThrow();

    expect(() =>
      expectPrivateZoneRobots(
        {
          rules: [
            { userAgent: "*", disallow: "/tasks" },
            ...AI_DISCOVERY_USER_AGENTS.map((userAgent) => ({
              userAgent,
              disallow: "/tasks",
            })),
          ],
          sitemap: "https://helvety.com/tasks/sitemap.xml",
        },
        "/tasks"
      )
    ).toThrow();

    expect(() =>
      expectPrivateZoneRobots(
        {
          rules: [
            { userAgent: "*", disallow: "/tasks" },
            ...AI_DISCOVERY_USER_AGENTS.map((userAgent) => ({
              userAgent,
              disallow: "/tasks",
            })),
          ],
        },
        "/tasks"
      )
    ).not.toThrow();
  });
});
