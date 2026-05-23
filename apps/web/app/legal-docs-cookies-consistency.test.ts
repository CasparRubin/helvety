import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELVETY_WEB_ZONE_APP_SLUGS } from "@/lib/legal-cookies-disclosure";

const REPO_ROOT = join(import.meta.dirname, "../../..");

/** Markdown/docs that must stay aligned with cookie and analytics facts. */
const CANONICAL_DOC_PATHS = [
  "docs/cookies-telemetry-and-footer.md",
  "docs/quality-modernization-baseline.md",
  "README.md",
  "packages/ui/README.md",
  "apps/web/README.md",
] as const;

const STALE_DOC_PHRASES = [
  "selected Helvety web surfaces",
  "account-based services also use authentication cookies",
  "similar storage technologies for security and core functionality; account-based",
  "Preference cookies:",
] as const;

describe("cookies and telemetry documentation consistency", () => {
  it.each(CANONICAL_DOC_PATHS)(
    "%s documents all ten analytics zone app slugs",
    async (relativePath) => {
      const source = await readFile(join(REPO_ROOT, relativePath), "utf8");
      for (const slug of HELVETY_WEB_ZONE_APP_SLUGS) {
        expect(source, `${relativePath} missing apps/${slug}`).toContain(slug);
      }
    }
  );

  it.each(CANONICAL_DOC_PATHS)(
    "%s does not contain outdated cookie or analytics phrases",
    async (relativePath) => {
      const source = await readFile(join(REPO_ROOT, relativePath), "utf8");
      for (const phrase of STALE_DOC_PHRASES) {
        expect(source, `${relativePath} contains stale phrase`).not.toContain(
          phrase
        );
      }
    }
  );

  it("canonical cookies doc links to privacy section 9", async () => {
    const source = await readFile(
      join(REPO_ROOT, "docs/cookies-telemetry-and-footer.md"),
      "utf8"
    );
    expect(source).toContain("helvety_device_trust");
    expect(source).toMatch(/all ten Next\.js apps/i);
    expect(source).toContain("legal-cookies-disclosure");
  });
});
