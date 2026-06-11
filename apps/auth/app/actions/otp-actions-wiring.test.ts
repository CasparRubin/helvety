import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const otpActionsPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "otp-actions.ts"
);

describe("otp-actions verifyEmailCode wiring", () => {
  const src = readFileSync(otpActionsPath, "utf8");

  it("returns rotated CSRF token in verifyEmailCode success payload", () => {
    expect(src).toContain("let rotatedCsrfToken = csrfToken");
    expect(src).toContain("rotatedCsrfToken = await generateCSRFToken()");
    expect(src).toContain("csrfToken: rotatedCsrfToken");
  });

  it("types verifyEmailCode success data with csrfToken", () => {
    const fnStart = src.indexOf("export async function verifyEmailCode");
    const fnBodyStart = src.indexOf(") {", fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnBodyStart).toBeGreaterThan(fnStart);
    expect(src.slice(fnStart, fnBodyStart)).toContain("csrfToken: string");
  });
});
