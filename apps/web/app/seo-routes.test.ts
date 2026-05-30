import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { urls } from "@helvety/shared/config";
import { AI_DISCOVERY_USER_AGENTS } from "@helvety/shared/seo";
import { assertValidPublicSitemapEntries } from "@helvety/shared/test-utils/seo-route-test-helpers";
import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

const gatewayLlmsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/llms.txt"
);

describe("web SEO routes", () => {
  it("returns crawlable robots output with sitemap index", () => {
    const robotsOutput = robots();
    const rules = Array.isArray(robotsOutput.rules)
      ? robotsOutput.rules
      : [robotsOutput.rules];

    expect(rules.map((rule) => rule.userAgent)).toEqual(
      expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
    );
    expect(rules.find((rule) => rule.userAgent === "*")).toMatchObject({
      allow: "/",
    });
    expect(robotsOutput.sitemap).toBe(`${urls.home}/sitemap-index.xml`);
    expect(robotsOutput.host).toBe(urls.home);
  });

  it("gateway llms.txt links per-zone agent guides", () => {
    const text = readFileSync(gatewayLlmsPath, "utf8");
    expect(text).toContain("## Agent And Crawler Guides");
    const zoneLlmsUrls = [
      urls.store,
      urls.pdf,
      urls.docs,
      urls.imageUpscaler,
      urls.auth,
      urls.contacts,
      urls.notes,
      urls.links,
      urls.tasks,
    ].map((base) => `${base}/llms.txt`);
    for (const llmsUrl of zoneLlmsUrls) {
      expect(text).toContain(llmsUrl);
    }
  });

  it("returns canonical public sitemap entries", () => {
    const entries = sitemap();
    const entryUrls = entries.map((entry) => entry.url);

    expect(entryUrls).toEqual(
      expect.arrayContaining([
        urls.home,
        `${urls.home}/impressum`,
        `${urls.home}/privacy`,
        `${urls.home}/terms`,
      ])
    );
    expect(entryUrls).toHaveLength(4);
    expect(entryUrls).not.toContain(`${urls.home}/llms.txt`);
    assertValidPublicSitemapEntries(entries);
  });
});
