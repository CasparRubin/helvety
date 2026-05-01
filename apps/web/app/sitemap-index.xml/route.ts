import { urls } from "@helvety/shared/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SITEMAP_PATHS = [
  "/sitemap.xml",
  "/store/sitemap.xml",
  "/pdf/sitemap.xml",
  "/image-upscaler/sitemap.xml",
] as const;

/** Timestamp captured at module initialization for stable response caching. */
const lastModified = new Date().toISOString();

/** Builds XML for the gateway sitemap index. */
function buildSitemapIndexXml(): string {
  const sitemapEntries = SITEMAP_PATHS.map(
    (path) =>
      `<sitemap><loc>${urls.home}${path}</loc><lastmod>${lastModified}</lastmod></sitemap>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

/** Returns the sitemap index listing public app sitemaps. */
export function GET(): NextResponse {
  return new NextResponse(buildSitemapIndexXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
