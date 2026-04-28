import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import { getAllProducts } from "@/lib/data/products";

import robots from "./robots";
import sitemap from "./sitemap";

describe("store SEO routes", () => {
  it("returns public robots output without self-blocking entries", () => {
    const robotsOutput = robots();
    const rules = Array.isArray(robotsOutput.rules)
      ? robotsOutput.rules[0]
      : robotsOutput.rules;
    const disallow = rules?.disallow;
    const disallowPaths = Array.isArray(disallow)
      ? disallow
      : disallow
        ? [disallow]
        : [];

    expect(rules?.allow).toBe("/");
    expect(disallowPaths).toEqual(
      expect.arrayContaining(["/account", "/api", "/auth"])
    );
    expect(disallowPaths).not.toContain("/store");
    expect(disallowPaths).not.toContain("/store/sitemap.xml");
    expect(robotsOutput.sitemap).toBe(`${urls.home}/store/sitemap.xml`);
  });

  it("returns public sitemap entries including all product URLs", () => {
    const entries = sitemap();
    const entryUrls = new Set(entries.map((entry) => entry.url));

    expect(entryUrls.has(urls.store)).toBe(true);
    expect(entryUrls.has(`${urls.store}/products`)).toBe(true);
    expect(entryUrls.has(`${urls.store}/llms.txt`)).toBe(true);

    for (const product of getAllProducts()) {
      expect(entryUrls.has(`${urls.store}/products/${product.slug}`)).toBe(
        true
      );
    }
  });
});
