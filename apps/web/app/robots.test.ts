import { AI_DISCOVERY_USER_AGENTS } from "@helvety/shared/seo";
import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("web robots", () => {
  it("exposes open crawl rules with sitemap index", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(result.sitemap).toContain("/sitemap-index.xml");
    expect(rules.map((rule) => rule.userAgent)).toEqual(
      expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
    );
    expect(rules.find((rule) => rule.userAgent === "*")).toMatchObject({
      allow: "/",
    });
  });
});
