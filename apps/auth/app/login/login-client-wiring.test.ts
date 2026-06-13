import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const loginClientPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "login-client.tsx"
);

describe("login-client wiring", () => {
  const src = readFileSync(loginClientPath, "utf8");

  it("uses shouldShowLoginBootstrapSpinner instead of checkingAuth alone", () => {
    expect(src).toContain("shouldShowLoginBootstrapSpinner");
    expect(src).toContain("otpVerifySucceeded: flow.otpVerifySucceeded");
    expect(src).not.toMatch(/if \(flow\.checkingAuth\) \{/);
  });
});
