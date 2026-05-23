import { AI_DISCOVERY_USER_AGENTS } from "@helvety/shared/seo";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("tasks SEO routes", () => {
  it("returns private robots output", () => {
    const robotsOutput = robots();
    const rules = Array.isArray(robotsOutput.rules)
      ? robotsOutput.rules
      : [robotsOutput.rules];

    expect(rules.map((rule) => rule.userAgent)).toEqual(
      expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
    );
    for (const rule of rules) {
      expect(rule.disallow).toBe("/");
    }
    expect(robotsOutput.sitemap).toBeUndefined();
  });

  it("returns an empty private sitemap", () => {
    expect(sitemap()).toEqual([]);
  });
});
