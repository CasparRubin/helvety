import { describe, expect, it } from "vitest";

import { HELVETY_WEB_DEFAULT_TITLE } from "./licensing";
import {
  AI_DISCOVERY_USER_AGENTS,
  createAppRobots,
  createAppSitemap,
  createHelvetyProductMetadata,
  createOpenRobots,
  createPrivateAppRobots,
  GATEWAY_DISALLOWED_PATHS,
  toHostAbsoluteZonePaths,
} from "./seo";
import { assertValidPublicSitemapEntries } from "./test-utils/seo-route-test-helpers";

/** Minimal robots rule shape used by helper assertions. */
type RobotsRule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

/** Normalizes robots rules into an array for assertions. */
function toRuleList(
  rules: RobotsRule | RobotsRule[] | undefined
): RobotsRule[] {
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

/** Flattens and deduplicates disallow entries from robots rules. */
function getDisallowedPaths(rules: RobotsRule | RobotsRule[]): string[] {
  const ruleList = toRuleList(rules);
  return [
    ...new Set(
      ruleList.flatMap((rule) => {
        if (!rule.disallow) return [];
        return Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
      })
    ),
  ];
}

/** Returns robots rules whose `userAgent` matches `agent`. */
function getRulesForAgent(
  rules: RobotsRule | RobotsRule[] | undefined,
  agent: string
): RobotsRule[] {
  return toRuleList(rules).filter((rule) => rule.userAgent === agent);
}

describe("seo helpers", () => {
  it("lists current vendor AI discovery user agents", () => {
    expect(AI_DISCOVERY_USER_AGENTS).toEqual([
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "Google-Extended",
      "ClaudeBot",
      "Claude-User",
      "Claude-SearchBot",
      "PerplexityBot",
      "Perplexity-User",
      "Applebot-Extended",
    ]);
    expect(AI_DISCOVERY_USER_AGENTS).not.toContain("anthropic-ai");
  });

  it("prefixes zone-relative disallow paths to host-absolute paths", () => {
    expect(toHostAbsoluteZonePaths(["/api", "/auth"], "/pdf")).toEqual([
      "/pdf/api",
      "/pdf/auth",
    ]);
    expect(
      toHostAbsoluteZonePaths(["/store/api", "/account"], "/store")
    ).toEqual(["/store/api", "/store/account"]);
  });

  it("keeps sitemap canonical URLs crawlable for public app configs", () => {
    const appConfigs = [
      {
        appPath: "/store",
        disallowedPaths: ["/account", "/api", "/auth"],
        sitemapPath: "/store/sitemap.xml",
        expectedDisallows: ["/store/account", "/store/api", "/store/auth"],
      },
      {
        appPath: "/pdf",
        disallowedPaths: ["/api", "/auth"],
        sitemapPath: "/pdf/sitemap.xml",
        expectedDisallows: ["/pdf/api", "/pdf/auth"],
      },
    ] as const;

    for (const config of appConfigs) {
      const sitemapEntries = createAppSitemap(config.appPath)();
      const canonicalUrl = sitemapEntries[0]?.url;
      const canonicalPath = new URL(canonicalUrl ?? "").pathname;

      const robots = createAppRobots(
        [...config.disallowedPaths],
        config.sitemapPath
      )();
      const disallowedPaths = getDisallowedPaths(robots.rules);

      expect(disallowedPaths).not.toContain(canonicalPath);
      expect(disallowedPaths).toEqual(
        expect.arrayContaining([...config.expectedDisallows])
      );
    }
  });

  it("removes self-blocking and duplicate disallow paths", () => {
    const robots = createAppRobots(
      ["/contacts", "/contacts/", "/contacts/sitemap.xml", "/api", "/api"],
      "/contacts/sitemap.xml"
    )();

    const disallowedPaths = getDisallowedPaths(robots.rules);
    expect(disallowedPaths).toEqual(["/contacts/api"]);
  });

  it("returns canonical app root URL only in generated app sitemaps", () => {
    const sitemapEntries = createAppSitemap("/pdf")();
    const urls = sitemapEntries.map((entry) => entry.url);

    expect(urls).toEqual(["https://helvety.com/pdf"]);
    assertValidPublicSitemapEntries(sitemapEntries);
  });

  it("disallows the zone path for private app robots configs", () => {
    const robots = createPrivateAppRobots("/tasks")();
    const disallowedPaths = getDisallowedPaths(robots.rules);

    expect(disallowedPaths).toEqual(["/tasks"]);
    expect(robots.host).toBe("https://helvety.com");
    expect(robots.sitemap).toBeUndefined();
  });

  it("can include sitemap output for private robots when explicitly enabled", () => {
    // Production private zones omit app/sitemap.ts and use includeSitemap: false.
    const robots = createPrivateAppRobots("/tasks", {
      includeSitemap: true,
      sitemapPath: "/tasks/sitemap.xml",
    })();

    expect(robots.sitemap).toBe("https://helvety.com/tasks/sitemap.xml");
  });

  it("returns an allow-all robots policy for open apps without disallows", () => {
    const robots = createOpenRobots("/sitemap.xml")();

    const disallowedPaths = getDisallowedPaths(robots.rules);
    expect(disallowedPaths).toEqual([]);
    expect(robots.sitemap).toBe("https://helvety.com/sitemap.xml");
    expect(robots.host).toBe("https://helvety.com");
  });

  it("applies gateway disallow paths on open robots when provided", () => {
    const robots = createOpenRobots(
      "/sitemap-index.xml",
      GATEWAY_DISALLOWED_PATHS
    )();
    const disallowedPaths = getDisallowedPaths(robots.rules);

    expect(disallowedPaths).toEqual(
      expect.arrayContaining(["/auth", "/tasks"])
    );
    expect(disallowedPaths).toEqual(
      expect.arrayContaining(["/store/account", "/pdf/api"])
    );
    expect(disallowedPaths).not.toContain("/");
  });

  it("allows major AI crawlers on public robots alongside *", () => {
    const robots = createOpenRobots("/sitemap-index.xml")();
    const ruleList = toRuleList(robots.rules);

    expect(ruleList.map((rule) => rule.userAgent)).toEqual(
      expect.arrayContaining(["*", ...AI_DISCOVERY_USER_AGENTS])
    );

    for (const agent of AI_DISCOVERY_USER_AGENTS) {
      const [rule] = getRulesForAgent(robots.rules, agent);
      expect(rule?.allow).toBe("/");
      expect(rule?.disallow).toBeUndefined();
    }
  });

  it("applies the same disallow paths to AI crawlers on partial-public app robots", () => {
    const robots = createAppRobots(
      ["/account", "/api"],
      "/store/sitemap.xml"
    )();
    const [gptRule] = getRulesForAgent(robots.rules, "GPTBot");

    expect(gptRule?.allow).toBe("/");
    expect(getDisallowedPaths(gptRule ? [gptRule] : [])).toEqual([
      "/store/account",
      "/store/api",
    ]);
  });

  it("disallows major AI crawlers on private app robots", () => {
    const robots = createPrivateAppRobots("/auth")();

    for (const agent of ["*", ...AI_DISCOVERY_USER_AGENTS]) {
      const disallowedPaths = getDisallowedPaths(
        getRulesForAgent(robots.rules, agent)
      );
      expect(disallowedPaths, agent).toEqual(["/auth"]);
    }
  });
});

describe("createHelvetyProductMetadata", () => {
  const baseParams = {
    metadataBase: "https://helvety.com/pdf",
    title: {
      default: "Helvety PDF | Edit PDFs in your browser",
      template: "%s | Helvety PDF",
    },
    description: "PDF toolkit description",
    keywords: ["pdf", "merge"] as const,
    siteName: "Helvety PDF",
    canonicalUrl: "https://helvety.com/pdf",
    brandImage: {
      url: "https://cdn.example.com/id.png",
      ogAlt: "Helvety PDF",
      twitterAlt: "Helvety PDF",
    },
    manifest: "/pdf/manifest.json",
    category: "productivity",
  } as const;

  it("sets indexable robots when indexing is all", () => {
    const m = createHelvetyProductMetadata({ ...baseParams, indexing: "all" });
    expect(m.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: expect.objectContaining({ index: true, follow: true }),
    });
    expect(m.alternates?.canonical).toBe("https://helvety.com/pdf");
    expect(m.manifest).toBe("/pdf/manifest.json");
    expect(m.category).toBe("productivity");
  });

  it("sets noindex robots when indexing is none", () => {
    const m = createHelvetyProductMetadata({
      ...baseParams,
      canonicalUrl: "https://helvety.com/notes",
      metadataBase: "https://helvety.com/notes",
      indexing: "none",
    });
    expect(m.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: expect.objectContaining({ index: false, follow: false }),
    });
  });

  it("omits twitter image alt when twitterAlt is unset", () => {
    const m = createHelvetyProductMetadata({
      ...baseParams,
      indexing: "all",
      brandImage: {
        url: "https://cdn.example.com/id.png",
        ogAlt: "Helvety",
      },
    });
    const twImages = m.twitter?.images;
    const twImg = Array.isArray(twImages) ? twImages[0] : twImages;
    expect(twImg).toEqual({ url: "https://cdn.example.com/id.png" });
  });

  it("uses socialTitle for OG and Twitter titles when provided", () => {
    const m = createHelvetyProductMetadata({
      ...baseParams,
      indexing: "all",
      title: { default: "Home", template: "%s | Helvety" },
      socialTitle: HELVETY_WEB_DEFAULT_TITLE,
    });
    expect(m.openGraph?.title).toBe(HELVETY_WEB_DEFAULT_TITLE);
    expect(m.twitter?.title).toBe(HELVETY_WEB_DEFAULT_TITLE);
  });

  it("uses summary_large_image Twitter cards and applicationName for PWA-style branding", () => {
    const m = createHelvetyProductMetadata({ ...baseParams, indexing: "all" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.applicationName).toBe("Helvety PDF");
    expect(m.referrer).toBe("origin-when-cross-origin");
  });

  it("omits manifest and category when not passed", () => {
    const m = createHelvetyProductMetadata({
      metadataBase: "https://helvety.com/auth",
      title: {
        default: "Helvety Auth | Sign in",
        template: "%s | Helvety Auth",
      },
      description: "Auth desc",
      keywords: ["auth"],
      siteName: "Helvety Auth",
      canonicalUrl: "https://helvety.com/auth",
      brandImage: {
        url: "https://cdn.example.com/id.png",
        ogAlt: "Helvety",
      },
      indexing: "none",
    });
    expect(m.manifest).toBeUndefined();
    expect(m.category).toBeUndefined();
  });
});
