import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /sitemap-index.xml", () => {
  it("returns a sitemap index containing all app sitemaps", async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(xml).toContain("<sitemapindex");

    const expectedSitemaps = [
      "/sitemap.xml",
      "/store/sitemap.xml",
      "/pdf/sitemap.xml",
      "/image-upscaler/sitemap.xml",
    ];

    for (const path of expectedSitemaps) {
      expect(xml).toContain(`<loc>https://helvety.com${path}</loc>`);
    }
  });
});
