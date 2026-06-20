import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

/** Maintainer docs that must stay accurate about web vs extension auth. */
const MAINTAINER_AUTH_DOC_PATHS = [
  "README.md",
  "apps/auth/README.md",
  "apps/auth/docs/extension-passkey-production.md",
  "docs/cookies-telemetry-and-footer.md",
  "docs/security-review-runbook.md",
  "packages/shared/README.md",
] as const;

/** Misleading if the extension is described as using the web device-trust cookie. */
const EXTENSION_DEVICE_TRUST_COOKIE_MISLEAD = [
  /extension.*mints.*helvety_device_trust/i,
  /extension.*sets.*helvety_device_trust/i,
  /chrome\.storage\.local.*helvety_device_trust/i,
] as const;

/** Retired runtime API; extension reads PostgREST under RLS instead. */
const RETIRED_PASSKEY_PARAMS_HTTP_PATH =
  /GET\s+\/api\/encryption\/passkey-params/i;

/** Legacy env var name; only allowed when documenting that it is unsupported. */
const LEGACY_EXTENSION_ORIGINS_ENV = "HELVEETY_CHROME_EXTENSION_ORIGINS";

describe("auth and extension maintainer copy guardrails", () => {
  it("maintainer docs do not imply the extension mints or stores helvety_device_trust", () => {
    const violations: string[] = [];

    for (const rel of MAINTAINER_AUTH_DOC_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      for (const re of EXTENSION_DEVICE_TRUST_COOKIE_MISLEAD) {
        if (re.test(text)) {
          violations.push(`${rel}: ${re.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("auth README documents extension weekly proof without device-trust cookie", () => {
    const readme = readFileSync(join(repoRoot, "apps/auth/README.md"), "utf8");
    expect(readme).toContain("helvety_extension_last_email_verified");
    expect(readme).toMatch(/does not.*mint.*helvety_device_trust/i);
    expect(readme).toContain("resolveVerifiedExtensionSession");
  });

  it("extension production doc does not document retired passkey-params HTTP GET", () => {
    const doc = readFileSync(
      join(repoRoot, "apps/auth/docs/extension-passkey-production.md"),
      "utf8"
    );
    expect(doc).not.toMatch(RETIRED_PASSKEY_PARAMS_HTTP_PATH);
    expect(doc).toMatch(/chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
  });

  it("cookies reference distinguishes web device-trust cookie from extension storage", () => {
    const doc = readFileSync(
      join(repoRoot, "docs/cookies-telemetry-and-footer.md"),
      "utf8"
    );
    expect(doc).toContain("helvety_device_trust");
    expect(doc).toContain("helvety_extension_last_email_verified");
    expect(doc).toMatch(/Chromium extension.*chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
    expect(doc).toMatch(/OTP anchor/i);
    expect(doc).not.toMatch(/chrome\.storage\.local.*weekly email proof/i);
  });

  it("security runbook distinguishes web device trust from extension JWT enforcement", () => {
    const doc = readFileSync(
      join(repoRoot, "docs/security-review-runbook.md"),
      "utf8"
    );
    expect(doc).toContain("helvety_device_trust");
    expect(doc).toMatch(/jwt-session-lifetime/i);
    expect(doc).toMatch(
      /does \*\*not\*\* use that cookie|does not use that cookie/i
    );
    expect(doc).toMatch(/OTP anchor/i);
  });

  it("extension production doc documents split session storage", () => {
    const doc = readFileSync(
      join(repoRoot, "apps/auth/docs/extension-passkey-production.md"),
      "utf8"
    );
    expect(doc).toMatch(/chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
    expect(doc).toMatch(/OTP anchor/i);
  });

  it("maintainer docs use HELVETY_CHROME_EXTENSION_ORIGINS (not legacy HELVEETY typo)", () => {
    for (const rel of MAINTAINER_AUTH_DOC_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      if (text.includes(LEGACY_EXTENSION_ORIGINS_ENV)) {
        expect(
          text,
          `${rel} must only mention ${LEGACY_EXTENSION_ORIGINS_ENV} as unsupported legacy`
        ).toMatch(/legacy|not supported|does not accept/i);
      }
    }
  });
});
