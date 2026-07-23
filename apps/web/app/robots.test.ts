import {
  AI_DISCOVERY_USER_AGENTS,
  GATEWAY_DISALLOWED_PATHS,
} from "@helvety/shared/seo";
import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("web robots", () => {
  it("exposes gateway crawl rules with sitemap index and host-absolute disallows", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(result.sitemap).toContain("/sitemap-index.xml");
    expect(rules.map((rule) => rule.userAgent)).toEqual(
      expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
    );
    const starRule = rules.find((rule) => rule.userAgent === "*");
    expect(starRule).toMatchObject({
      allow: "/",
    });
    const disallow = starRule?.disallow;
    const disallowPaths = Array.isArray(disallow)
      ? disallow
      : disallow
        ? [disallow]
        : [];
    expect(disallowPaths).toEqual(
      expect.arrayContaining([...GATEWAY_DISALLOWED_PATHS])
    );
  });
});
