import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELVETY_STALE_COOKIE_DOC_PHRASES,
  HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
} from "@/lib/legal-cookies-disclosure";

const REPO_ROOT = join(import.meta.dirname, "../../..");

/** Markdown/docs that must stay aligned with cookie facts. */
const CANONICAL_DOC_PATHS = [
  "docs/cookies-telemetry-and-footer.md",
  "docs/quality-modernization-baseline.md",
  "README.md",
  "packages/ui/README.md",
  "apps/web/README.md",
] as const;

const STALE_DOC_PHRASES = [
  ...HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
  ...HELVETY_STALE_COOKIE_DOC_PHRASES,
] as const;

describe("cookies and storage documentation consistency", () => {
  it.each(CANONICAL_DOC_PATHS)(
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

  it("canonical cookies doc links to privacy section 9 and states no third-party analytics", async () => {
    const source = await readFile(
      join(REPO_ROOT, "docs/cookies-telemetry-and-footer.md"),
      "utf8"
    );
    expect(source).toContain("helvety_device_trust");
    expect(source).toContain("legal-cookies-disclosure");
    expect(source).toContain(
      "We do not mount third-party analytics or advertising trackers"
    );
  });
});
