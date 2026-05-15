import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertNoEmDashInCustomerCopy } from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a legal page module from the web app for static copy assertions. */
function readLegalPage(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("web legal pages copy", () => {
  it.each([
    ["terms", "apps/web/app/terms/page.tsx"],
    ["impressum", "apps/web/app/impressum/page.tsx"],
    ["privacy", "apps/web/app/privacy/page.tsx"],
  ] as const)("%s page contains no em-dash", (_label, rel) => {
    assertNoEmDashInCustomerCopy(rel, readLegalPage(rel));
  });
});
