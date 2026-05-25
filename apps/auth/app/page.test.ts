import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pagePath = join(dirname(fileURLToPath(import.meta.url)), "page.tsx");

describe("auth root page redirect", () => {
  it("uses login-entry resolver instead of hardcoded step query", () => {
    const src = readFileSync(pagePath, "utf8");

    expect(src).toContain("resolveLoginEntryStep");
    expect(src).toContain("buildAuthLoginPath");
    expect(src).not.toContain("&step=passkey-signin");
    expect(src).not.toMatch(/stepParam/);
  });
});
