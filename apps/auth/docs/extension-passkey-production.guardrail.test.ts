import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const authRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("extension passkey production docs", () => {
  it("README links to production setup guide", () => {
    const readme = readFileSync(join(authRoot, "README.md"), "utf8");
    expect(readme).toContain("docs/extension-passkey-production.md");
  });

  it("env-vercel-audit-checklist matches production guide (bare id + curl)", () => {
    const checklist = readFileSync(
      join(authRoot, "../../docs/env-vercel-audit-checklist.md"),
      "utf8"
    );
    expect(checklist).toContain("kjdldfioiofpblkchjodefakpopmkjjf");
    expect(checklist).toContain("/api/extension/passkey/options");
  });

  it("production guide documents bare extension id env and curl verify", () => {
    const doc = readFileSync(
      join(authRoot, "docs/extension-passkey-production.md"),
      "utf8"
    );
    expect(doc).toContain("HELVETY_CHROME_EXTENSION_ORIGINS");
    expect(doc).toContain("kjdldfioiofpblkchjodefakpopmkjjf");
    expect(doc).toContain("/api/extension/passkey/options");
    expect(doc).toMatch(/401.*JSON|JSON.*401/i);
    expect(doc).not.toContain("localhost");
    expect(doc).toMatch(/404.*HTML|HTML.*404/i);
    expect(doc).toMatch(/allowlist/i);
    expect(doc).toMatch(/not authorized to sign in yet|user-safe/i);
    expect(doc).toMatch(/creates a Helvety account when the email is new/i);
    expect(doc).toMatch(/runtime extension id|your runtime id/i);
    expect(doc).toMatch(/side panel/i);
    expect(doc).toMatch(/weekly proof|weekly_proof/i);
    expect(doc).toContain("X-Helvety-Weekly-Proof");
  });
});
