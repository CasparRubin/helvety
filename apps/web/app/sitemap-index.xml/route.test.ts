import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /sitemap-index.xml", () => {
  it("returns a sitemap index containing all public app sitemaps", async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(xml).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );

    const expectedSitemaps = [
      "/sitemap.xml",
      "/store/sitemap.xml",
      "/pdf/sitemap.xml",
      "/image-editor/sitemap.xml",
      "/ocr/sitemap.xml",
    ];

    for (const path of expectedSitemaps) {
      expect(xml).toContain(`<loc>https://helvety.com${path}</loc>`);
    }

    expect(xml).not.toContain("/image-upscaler/sitemap.xml");
    expect(xml).not.toContain("/auth/sitemap.xml");
    expect(xml).not.toContain("/tasks/sitemap.xml");

    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1]
    );
    expect(locMatches.every((loc) => loc?.startsWith("https://"))).toBe(true);

    // Exhaustive: the index must list exactly the public-zone sitemaps (no
    // retired/stray zones such as a removed app sneaking back in).
    expect([...locMatches].sort()).toEqual(
      expectedSitemaps.map((path) => `https://helvety.com${path}`).sort()
    );
  });
});
