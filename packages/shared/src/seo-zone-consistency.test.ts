import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
  "docs",
  "image-upscaler",
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

  it("private zone READMEs document absent sitemap routes", async () => {
    for (const appId of PRIVATE_ZONE_APP_IDS) {
      const readme = await readFile(
        resolve(repoRoot, `apps/${appId}/README.md`),
        "utf8"
      );
      expect(readme).toMatch(/sitemap\.xml.*404|not published \(404\)/i);
      expect(readme).not.toMatch(/intentionally empty/i);
      expect(readme).toMatch(/llms\.txt.*robots|robots.*llms\.txt/i);
    }
  });

  it("public tool READMEs describe single-URL or scoped sitemaps without llms.txt", async () => {
    const scopedReadmes: ReadonlyArray<{ appId: string; pattern: RegExp }> = [
      { appId: "pdf", pattern: /app root URL only/i },
      { appId: "docs", pattern: /app root URL only/i },
      {
        appId: "image-upscaler",
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
    expect(llms).toMatch(/robots\.txt|gateway links/i);
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
