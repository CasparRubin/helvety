import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const csrfPath = join(dirname(fileURLToPath(import.meta.url)), "csrf.ts");

describe("csrf module documentation wiring", () => {
  it("documents client sync after post-auth rotation", () => {
    const src = readFileSync(csrfPath, "utf8");

    expect(src).toContain("useSetCSRFToken");
    expect(src).toContain("generateCSRFToken()");
    expect(src).toContain("auth OTP verify");
  });
});
