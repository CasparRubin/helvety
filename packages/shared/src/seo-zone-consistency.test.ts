import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  createAppRobots,
  createPrivateAppRobots,
  GATEWAY_DISALLOWED_PATHS,
} from "./seo";

/** Private non-indexable zones (auth + E2EE vault apps): no sitemap route (empty urlset breaks Google Search Console). */
const PRIVATE_ZONE_APP_IDS = [
  "auth",
  "contacts",
  "notes",
  "tasks",
  "links",
] as const;

/** Public indexable zones listed in the gateway sitemap index. */
const PUBLIC_ZONE_APP_IDS = [
  "web",
  "store",
  "pdf",
  "image-upscaler",
  "image-editor",
  "ocr",
] as const;

/** Public product zones that mirror disallow rules under their basePath. */
const PUBLIC_TOOL_ZONE_ROBOTS = [
  {
    appId: "store",
    relativeDisallows: ["/account", "/api", "/auth"],
    sitemapPath: "/store/sitemap.xml",
  },
  {
    appId: "pdf",
    relativeDisallows: ["/api", "/auth"],
    sitemapPath: "/pdf/sitemap.xml",
  },
  {
    appId: "image-upscaler",
    relativeDisallows: ["/api", "/auth"],
    sitemapPath: "/image-upscaler/sitemap.xml",
  },
  {
    appId: "image-editor",
    relativeDisallows: ["/api", "/auth"],
    sitemapPath: "/image-editor/sitemap.xml",
  },
  {
    appId: "ocr",
    relativeDisallows: ["/api", "/auth"],
    sitemapPath: "/ocr/sitemap.xml",
  },
] as const;

/** Tool PWAs whose short_name must keep the Helvety brand. */
const BRANDED_SHORT_NAME_APPS = [
  { appId: "ocr", shortName: "Helvety OCR" },
  { appId: "image-editor", shortName: "Helvety Image Editor" },
  { appId: "image-upscaler", shortName: "Helvety Image Upscaler" },
] as const;

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

/** Returns whether a repo-relative path exists. */
async function pathExists(relativePath: string): Promise<boolean> {
  try {
    await access(resolve(repoRoot, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Flattens disallow entries from a robots rule list. */
function flattenDisallows(
  rules: ReadonlyArray<{ disallow?: string | string[] }>
): string[] {
  return [
    ...new Set(
      rules.flatMap((rule) => {
        if (!rule.disallow) return [];
        return Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
      })
    ),
  ];
}

describe("SEO zone consistency", () => {
  it("private zones omit app/sitemap.ts", async () => {
    for (const appId of PRIVATE_ZONE_APP_IDS) {
      expect(
        await pathExists(`apps/${appId}/app/sitemap.ts`),
        `${appId} must not publish an empty sitemap route`
      ).toBe(false);
      expect(await pathExists(`apps/${appId}/app/robots.ts`)).toBe(true);
    }
  });

  it("public zones publish app/sitemap.ts and app/robots.ts", async () => {
    for (const appId of PUBLIC_ZONE_APP_IDS) {
      expect(await pathExists(`apps/${appId}/app/sitemap.ts`)).toBe(true);
      expect(await pathExists(`apps/${appId}/app/robots.ts`)).toBe(true);
    }
  });

  it("gateway disallow list covers private zones and public-tool mirrors", () => {
    const expected = new Set<string>([
      ...PRIVATE_ZONE_APP_IDS.map((appId) => `/${appId}`),
    ]);

    for (const zone of PUBLIC_TOOL_ZONE_ROBOTS) {
      const robots = createAppRobots(
        [...zone.relativeDisallows],
        zone.sitemapPath
      )();
      const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
      for (const path of flattenDisallows(rules)) {
        expected.add(path);
      }
    }

    for (const appId of PRIVATE_ZONE_APP_IDS) {
      const robots = createPrivateAppRobots(`/${appId}`)();
      const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
      for (const path of flattenDisallows(rules)) {
        expected.add(path);
      }
    }

    expect([...GATEWAY_DISALLOWED_PATHS].sort()).toEqual([...expected].sort());
  });

  it("tool PWA manifests keep Helvety-branded short_name values", async () => {
    for (const { appId, shortName } of BRANDED_SHORT_NAME_APPS) {
      const manifest = JSON.parse(
        await readFile(
          resolve(repoRoot, `apps/${appId}/public/manifest.json`),
          "utf8"
        )
      ) as { short_name?: string; name?: string };
      expect(manifest.short_name, appId).toBe(shortName);
      expect(manifest.name, appId).toMatch(/^Helvety /);
    }
  });

  it("private zone READMEs document absent sitemap routes", async () => {
    for (const appId of PRIVATE_ZONE_APP_IDS) {
      const readme = await readFile(
        resolve(repoRoot, `apps/${appId}/README.md`),
        "utf8"
      );
      expect(readme).toMatch(/sitemap\.xml.*404|not published \(404\)/i);
      expect(readme).not.toMatch(/intentionally empty/i);
      expect(readme).toMatch(/llms\.txt/i);
      expect(readme).toMatch(/robots\.txt.*disallow|disallows `\//i);
      expect(readme).not.toMatch(
        /llms\.txt remains discoverable via robots and gateway links/i
      );
    }
  });

  it("public tool READMEs describe single-URL or scoped sitemaps without llms.txt", async () => {
    const scopedReadmes: ReadonlyArray<{ appId: string; pattern: RegExp }> = [
      { appId: "pdf", pattern: /app root URL only/i },
      {
        appId: "image-upscaler",
        pattern: /app root URL only/i,
      },
      {
        appId: "image-editor",
        pattern: /app root URL only/i,
      },
      {
        appId: "ocr",
        pattern: /app root URL only/i,
      },
      {
        appId: "store",
        pattern: /excludes.*llms\.txt|llms\.txt.*excludes/i,
      },
      {
        appId: "web",
        pattern: /no `llms\.txt`|terms; no `llms\.txt`/i,
      },
    ];

    for (const { appId, pattern } of scopedReadmes) {
      const readme = await readFile(
        resolve(repoRoot, `apps/${appId}/README.md`),
        "utf8"
      );
      expect(readme, appId).toMatch(pattern);
    }
  });

  it("gateway llms.txt does not claim llms.txt is linked from sitemaps", async () => {
    const llms = await readFile(
      resolve(repoRoot, "apps/web/public/llms.txt"),
      "utf8"
    );
    expect(llms).not.toMatch(/linked from each app'?s sitemap/i);
    expect(llms).toMatch(/robots\.txt/i);
    expect(llms).toMatch(/robots-disallowed prefix/i);
  });

  it("app consistency checklist documents private zones without sitemap routes", async () => {
    const checklist = await readFile(
      resolve(repoRoot, "docs/app-consistency-checklist.md"),
      "utf8"
    );
    expect(checklist).toMatch(/no.*`app\/sitemap\.ts`|omit this file/i);
    expect(checklist).not.toMatch(/intentionally empty/i);
  });
});
