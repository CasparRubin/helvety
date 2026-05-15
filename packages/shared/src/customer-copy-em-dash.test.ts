import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it } from "vitest";

import { CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS } from "./customer-copy-guardrails";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("user-facing copy em-dash guardrail", () => {
  it.each(CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS)(
    "%s contains no em-dash",
    (rel) => {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      assertNoEmDashInCustomerCopy(rel, text);
    }
  );
});
