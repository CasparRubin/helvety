import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("web robots", () => {
  it("exposes open crawl rules with sitemap index", () => {
    const result = robots();
    expect(result.sitemap).toContain("/sitemap-index.xml");
    expect(result.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
    });
  });
});
