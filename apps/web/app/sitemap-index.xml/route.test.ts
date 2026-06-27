import { describe, expect, it } from "vitest";

import { GET } from "./route";

const PRIVATE_ZONE_SITEMAP_PATHS = [
  "/auth/sitemap.xml",
  "/contacts/sitemap.xml",
  "/notes/sitemap.xml",
  "/tasks/sitemap.xml",
  "/links/sitemap.xml",
] as const;

describe("GET /sitemap-index.xml", () => {
  it("returns a sitemap index containing all app sitemaps", async () => {
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
      "/image-upscaler/sitemap.xml",
    ];

    for (const path of expectedSitemaps) {
      expect(xml).toContain(`<loc>https://helvety.com${path}</loc>`);
    }

    for (const path of PRIVATE_ZONE_SITEMAP_PATHS) {
      expect(xml).not.toContain(path);
    }

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
