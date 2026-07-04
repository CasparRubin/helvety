import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELVETY_STALE_COOKIE_DOC_PHRASES } from "./analytics-guardrails";
import { CUSTOMER_COPY_LLMS_RELATIVE_PATHS } from "./customer-copy-guardrails";

const repoRoot = join(import.meta.dirname, "..", "..", "..");

/** Maintainer docs that must stay accurate about web vs extension auth. */
const MAINTAINER_AUTH_DOC_PATHS = [
  "README.md",
  "apps/auth/README.md",
  "apps/auth/docs/extension-passkey-production.md",
  "docs/cookies-telemetry-and-footer.md",
  "docs/security-review-runbook.md",
  "docs/app-consistency-checklist.md",
  "docs/legal-change-guardrails.md",
  "packages/shared/README.md",
] as const;

/** Legal page sources that must not describe retired extension auth behavior. */
const LEGAL_PAGE_PATHS = [
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/impressum/page.tsx",
] as const;

/** Retired extension weekly re-auth wording. */
const RETIRED_EXTENSION_WEEKLY_REAUTH_DOC = [
  /weekly OTP anchor/i,
  /helvety_extension_last_email_verified/i,
  /JWT max lifetime.*extension/i,
  /extension.*JWT max lifetime/i,
  /jwt-session-lifetime/i,
  /isJwtWithinMaxLifetime/i,
  /email-proof anchor/i,
  /chrome\.storage\.local.*weekly email proof/i,
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

/** Outdated device-trust mint wording (read-back alone was never the only check). */
const STALE_DEVICE_TRUST_MINT_DOC_PHRASES = [
  /mint\/read-back/i,
  /read-back verifies/i,
  /not readable after set/i,
] as const;

/** Docs scanned for retired extension auth + stale vault cookie TTL phrases. */
const DOC_COPY_SCAN_PATHS = [
  ...MAINTAINER_AUTH_DOC_PATHS,
  ...LEGAL_PAGE_PATHS,
  ...CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
] as const;

/** Reads a repo file relative to the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("auth and extension maintainer copy guardrails", () => {
  it.each(MAINTAINER_AUTH_DOC_PATHS)("%s exists on disk", (rel) => {
    expect(existsSync(join(repoRoot, rel)), rel).toBe(true);
  });

  it.each(DOC_COPY_SCAN_PATHS)(
    "%s does not use retired extension weekly re-auth wording",
    (rel) => {
      const text = readRepoFile(rel);
      for (const re of RETIRED_EXTENSION_WEEKLY_REAUTH_DOC) {
        expect(text, `${rel}: ${re.source}`).not.toMatch(re);
      }
    }
  );

  it.each(MAINTAINER_AUTH_DOC_PATHS)(
    "%s does not imply the extension mints or stores helvety_device_trust",
    (rel) => {
      const text = readRepoFile(rel);
      for (const re of EXTENSION_DEVICE_TRUST_COOKIE_MISLEAD) {
        expect(text, `${rel}: ${re.source}`).not.toMatch(re);
      }
    }
  );

  it.each(MAINTAINER_AUTH_DOC_PATHS)(
    "%s does not use outdated device-trust mint/read-back-only wording",
    (rel) => {
      const text = readRepoFile(rel);
      for (const re of STALE_DEVICE_TRUST_MINT_DOC_PHRASES) {
        expect(text, `${rel}: ${re.source}`).not.toMatch(re);
      }
    }
  );

  it.each(CUSTOMER_COPY_LLMS_RELATIVE_PATHS)(
    "%s does not contain stale vault cookie TTL phrases",
    (rel) => {
      const text = readRepoFile(rel);
      for (const phrase of HELVETY_STALE_COOKIE_DOC_PHRASES) {
        expect(text, `${rel}: ${phrase}`).not.toContain(phrase);
      }
    }
  );

  it("auth README documents extension weekly proof without device-trust cookie", () => {
    const readme = readRepoFile("apps/auth/README.md");
    expect(readme).toContain("helvety_extension_weekly_proof");
    expect(readme).toContain("weekly_proof");
    expect(readme).toMatch(/does not.*HttpOnly device-trust cookie/i);
    expect(readme).toContain("resolveVerifiedExtensionSession");
    expect(readme).toContain("X-Helvety-Weekly-Proof");
  });

  it("root README documents extension auth APIs and weekly proof split from web cookie", () => {
    const readme = readRepoFile("README.md");
    expect(readme).toContain("HELVETY_CHROME_EXTENSION_ORIGINS");
    expect(readme).toContain("extension-passkey-production.md");
    expect(readme).toMatch(/weekly_proof|weekly proof/i);
    expect(readme).toMatch(/does not receive the web.*helvety_device_trust/i);
  });

  it("extension production doc does not document retired passkey-params HTTP GET", () => {
    const doc = readRepoFile("apps/auth/docs/extension-passkey-production.md");
    expect(doc).not.toMatch(RETIRED_PASSKEY_PARAMS_HTTP_PATH);
    expect(doc).toMatch(/chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
    expect(doc).toContain("X-Helvety-Weekly-Proof");
  });

  it("cookies reference distinguishes web device-trust cookie from extension storage", () => {
    const doc = readRepoFile("docs/cookies-telemetry-and-footer.md");
    expect(doc).toContain("helvety_device_trust");
    expect(doc).toContain("helvety_extension_weekly_proof");
    expect(doc).toMatch(/Chromium extension.*chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
    expect(doc).toMatch(/weekly proof|weekly_proof|weekly re-auth/i);
    expect(doc).not.toMatch(/chrome\.storage\.local.*weekly email proof/i);
  });

  it("security runbook distinguishes web device trust from extension weekly proof", () => {
    const doc = readRepoFile("docs/security-review-runbook.md");
    expect(doc).toContain("helvety_device_trust");
    expect(doc).toMatch(/weekly_proof|helvety_extension_weekly_proof/i);
    expect(doc).toMatch(
      /does \*\*not\*\* use that cookie|does not use that cookie/i
    );
    expect(doc).toMatch(/weekly proof|weekly_proof|weekly re-auth/i);
    expect(doc).toMatch(/3600s JWT \+ 7d time-box \+ 24h inactivity/i);
  });

  it("extension production doc documents split session storage and weekly proof", () => {
    const doc = readRepoFile("apps/auth/docs/extension-passkey-production.md");
    expect(doc).toMatch(/chrome\.storage\.local/i);
    expect(doc).toContain("chrome.storage.session");
    expect(doc).toMatch(/weekly proof|weekly_proof/i);
  });

  it("legal change guardrails references extension weekly proof verification", () => {
    const doc = readRepoFile("docs/legal-change-guardrails.md");
    expect(doc).toMatch(/extension OTP APIs|extension passkey APIs/i);
    expect(doc).toMatch(/legal-cookies-disclosure|Privacy §9/i);
    expect(doc).toMatch(
      /auth-extension-copy-guardrails|weekly_proof|weekly proof/i
    );
  });

  it("maintainer docs use HELVETY_CHROME_EXTENSION_ORIGINS (not legacy HELVEETY typo)", () => {
    for (const rel of MAINTAINER_AUTH_DOC_PATHS) {
      const text = readRepoFile(rel);
      if (text.includes(LEGACY_EXTENSION_ORIGINS_ENV)) {
        expect(
          text,
          `${rel} must only mention ${LEGACY_EXTENSION_ORIGINS_ENV} as unsupported legacy`
        ).toMatch(/legacy|not supported|does not accept/i);
      }
    }
  });
});
