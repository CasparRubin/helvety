import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS,
  HELVETY_STALE_COOKIE_DOC_PHRASES,
  HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
  HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS,
} from "@helvety/shared/analytics-guardrails";
import { describe, expect, it } from "vitest";

import { HELVETY_WEB_ZONE_APP_SLUGS } from "@/lib/legal-cookies-disclosure";

const REPO_ROOT = join(import.meta.dirname, "../../..");

const ZONE_README_PATHS = HELVETY_WEB_ZONE_APP_SLUGS.map(
  (slug) => `apps/${slug}/README.md`
);

/** Markdown/docs that must stay aligned with cookie facts. */
const CANONICAL_DOC_PATHS = [
  "docs/cookies-telemetry-and-footer.md",
  "docs/quality-modernization-baseline.md",
  "README.md",
  "packages/ui/README.md",
  "apps/web/public/llms.txt",
  ...ZONE_README_PATHS,
  ...HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS,
] as const;

const STALE_DOC_PHRASES = [
  ...HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
  ...HELVETY_STALE_COOKIE_DOC_PHRASES,
] as const;

const STALE_PHRASE_EXCLUDED_PATHS = new Set<string>(
  HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS
);

const DOCS_WITH_FULL_STALE_PHRASE_SCAN = CANONICAL_DOC_PATHS.filter(
  (path) => !STALE_PHRASE_EXCLUDED_PATHS.has(path)
);

describe("cookies and storage documentation consistency", () => {
  it("canonical doc paths cover every web zone README", () => {
    expect(ZONE_README_PATHS).toHaveLength(HELVETY_WEB_ZONE_APP_SLUGS.length);
    for (const slug of HELVETY_WEB_ZONE_APP_SLUGS) {
      expect(CANONICAL_DOC_PATHS).toContain(`apps/${slug}/README.md`);
    }
  });

  it.each(DOCS_WITH_FULL_STALE_PHRASE_SCAN)(
    "%s does not contain stale cookie or tracking phrases",
    async (relativePath) => {
      const source = await readFile(join(REPO_ROOT, relativePath), "utf8");
      for (const phrase of STALE_DOC_PHRASES) {
        expect(source, `${relativePath} contains stale phrase`).not.toContain(
          phrase
        );
      }
    }
  );

  it("env-vercel-audit-checklist documents analytics removal without legacy code markers", async () => {
    const source = await readFile(
      join(REPO_ROOT, "docs/env-vercel-audit-checklist.md"),
      "utf8"
    );
    expect(source).toContain("Web Analytics");
    expect(source).toContain("Speed Insights");
    expect(source).toContain("NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS");
    for (const marker of HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS) {
      expect(
        source,
        `operator doc must not contain legacy code marker: ${marker}`
      ).not.toContain(marker);
    }
  });

  it("canonical cookies doc links to privacy section 8 and states no third-party analytics", async () => {
    const source = await readFile(
      join(REPO_ROOT, "docs/cookies-telemetry-and-footer.md"),
      "utf8"
    );
    expect(source).toContain("Theme preference");
    expect(source).toContain("helvety-pdf-columns");
    expect(source).toContain("legal-cookies-disclosure");
    expect(source).toContain(
      "We do not mount third-party analytics or advertising trackers"
    );
    expect(source).not.toContain("helvety_device_trust");
    expect(source).not.toContain("helvety-prf-salt");
    expect(source).not.toContain("weekly_proof");
  });

  it("gateway llms.txt states no third-party analytics", async () => {
    const source = await readFile(
      join(REPO_ROOT, "apps/web/public/llms.txt"),
      "utf8"
    );
    expect(source).toContain(
      "We do not use third-party analytics or advertising trackers"
    );
  });
});
