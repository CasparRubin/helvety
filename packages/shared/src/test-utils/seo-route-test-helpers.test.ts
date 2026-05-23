import { describe, expect, it } from "vitest";

import { AI_DISCOVERY_USER_AGENTS } from "../seo";

import {
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
        { userAgent: "*", allow: "/", disallow: ["/api"] },
        ...AI_DISCOVERY_USER_AGENTS.map((userAgent) => ({
          userAgent,
          allow: "/",
          disallow: ["/api"],
        })),
      ],
      sitemap: "https://helvety.com/pdf/sitemap.xml",
    };

    expect(() =>
      expectPublicCrawlerRobots(robotsOutput, {
        disallowPaths: ["/api"],
        sitemap: "https://helvety.com/pdf/sitemap.xml",
      })
    ).not.toThrow();
  });
});
