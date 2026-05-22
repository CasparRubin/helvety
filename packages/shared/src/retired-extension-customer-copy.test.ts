import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS } from "./customer-copy-guardrails";
import {
  RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS,
  RETIRED_HELVETY_EXTENSION_NAME_PATTERNS,
} from "./retired-power-platform-extension-naming";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

/** Returns human-readable hits when `text` contains a retired extension name pattern. */
function findRetiredNameViolations(
  relativePath: string,
  text: string
): string[] {
  const hits: string[] = [];
  for (const { label, re } of RETIRED_HELVETY_EXTENSION_NAME_PATTERNS) {
    if (re.test(text)) {
      hits.push(`${relativePath}: ${label}`);
    }
  }
  return hits;
}

describe("retired Power Automate extension naming in customer-facing copy", () => {
  it("user-facing copy paths do not contain retired Helvety extension slugs or titles", () => {
    const violations: string[] = [];

    for (const relativePath of CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS) {
      if (
        RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS.includes(
          relativePath as (typeof RETIRED_EXTENSION_NAME_ALLOWLIST_PATHS)[number]
        )
      ) {
        continue;
      }
      const text = readFileSync(join(repoRoot, relativePath), "utf8");
      violations.push(...findRetiredNameViolations(relativePath, text));
    }

    expect(violations).toEqual([]);
  });
});
