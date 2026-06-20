import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS } from "@helvety/shared/customer-copy-guardrails";
import { describe, expect, it } from "vitest";

import {
  OTP_CODE_LENGTH,
  OTP_CODE_REGEX,
  OTP_USER_VISIBLE_EXPIRY_LABEL,
  OTP_USER_VISIBLE_LENGTH_LABEL,
} from "./otp-code";
import {
  OTP_CODE_TOO_LONG,
  OTP_CODE_TOO_SHORT,
  VALID_OTP_CODE,
} from "./otp-test-fixtures";

const authRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(authRoot, "..", "..");

/** Outdated OTP length copy that must not appear in user-facing or maintainer docs. */
const FORBIDDEN_OTP_LENGTH_COPY = [
  /6.?8 digit/i,
  /typically 6/i,
  /six digit/i,
  /\b6 digit/i,
] as const;

/** Reads a file under `apps/auth` for wiring guardrail assertions. */
function readAuthFile(relativePath: string): string {
  return readFileSync(join(authRoot, relativePath), "utf8");
}

/** Reads a repo-relative path from the monorepo root. */
function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

/** Lists Supabase auth email HTML templates shipped with the auth app. */
function listAuthEmailTemplates(): string[] {
  const emailsDir = join(authRoot, "emails");
  return readdirSync(emailsDir)
    .filter((name) => name.endsWith(".html"))
    .map((name) => join(emailsDir, name));
}

describe("otp-code guardrails", () => {
  it("accepts and rejects codes derived from OTP_CODE_LENGTH", () => {
    expect(OTP_CODE_REGEX.test(VALID_OTP_CODE)).toBe(true);
    expect(OTP_CODE_REGEX.test(OTP_CODE_TOO_SHORT)).toBe(false);
    expect(OTP_CODE_REGEX.test(OTP_CODE_TOO_LONG)).toBe(false);
  });

  it("verify paths use shared OTP_CODE_REGEX from otp-code", () => {
    expect(readAuthFile("app/actions/otp-actions.ts")).toContain(
      "verifyOtpWithSupabaseClient"
    );
    expect(readAuthFile("lib/otp-send-verify-core.ts")).toContain(
      'from "@/lib/otp-code"'
    );
    expect(readAuthFile("lib/otp-send-verify-core.ts")).toContain(
      "OTP_CODE_REGEX"
    );
  });

  it("verify-code-step binds input length and completion check to OTP_CODE_LENGTH", () => {
    const src = readAuthFile("components/login/verify-code-step.tsx");
    expect(src).toContain("OTP_CODE_LENGTH");
    expect(src).toContain("minLength={OTP_CODE_LENGTH}");
    expect(src).toContain("maxLength={OTP_CODE_LENGTH}");
    expect(src).toContain("isOtpCodeComplete");
    expect(src).toContain("OTP_USER_VISIBLE_LENGTH_LABEL");
    expect(src).not.toMatch(/6.?8 digit/i);
    expect(src).not.toContain('"8 digits"');
  });

  it("README documents fixed-length OTP verification and expiry alignment", () => {
    const readme = readAuthFile("README.md");
    expect(readme).toContain(
      `OTP verification (${OTP_USER_VISIBLE_LENGTH_LABEL})`
    );
    expect(readme).toContain("OTP_USER_VISIBLE_EXPIRY_LABEL");
    expect(readme).not.toMatch(/6.?8 digit/i);
  });

  it("privacy policy describes current OTP length without outdated ranges", () => {
    const privacy = readRepoFile("apps/web/app/privacy/page.tsx");
    expect(privacy).toContain(`${OTP_CODE_LENGTH}-digit verification codes`);
    for (const pattern of FORBIDDEN_OTP_LENGTH_COPY) {
      expect(privacy).not.toMatch(pattern);
    }
  });

  it("terms and impressum do not describe outdated OTP digit ranges", () => {
    for (const rel of [
      "apps/web/app/terms/page.tsx",
      "apps/web/app/impressum/page.tsx",
    ]) {
      const text = readRepoFile(rel);
      for (const pattern of FORBIDDEN_OTP_LENGTH_COPY) {
        expect(text, rel).not.toMatch(pattern);
      }
    }
  });

  it("auth SEO copy avoids outdated OTP digit ranges", () => {
    const descriptions = readRepoFile(
      "packages/shared/src/app-product-descriptions.ts"
    );
    for (const pattern of FORBIDDEN_OTP_LENGTH_COPY) {
      expect(descriptions).not.toMatch(pattern);
    }
  });

  it("typed OTP email templates state 1-hour expiry and avoid outdated digit ranges", () => {
    for (const templatePath of listAuthEmailTemplates()) {
      const html = readFileSync(templatePath, "utf8");
      if (!html.includes("{{ .Token }}")) {
        continue;
      }
      expect(html).toContain(
        `This code expires in ${OTP_USER_VISIBLE_EXPIRY_LABEL}.`
      );
      for (const pattern of FORBIDDEN_OTP_LENGTH_COPY) {
        expect(html, templatePath).not.toMatch(pattern);
      }
    }
  });

  it("scanned customer-facing copy paths avoid outdated OTP digit ranges", () => {
    const violations: string[] = [];

    for (const rel of CUSTOMER_COPY_USER_FACING_RELATIVE_PATHS) {
      const text = readRepoFile(rel);
      for (const pattern of FORBIDDEN_OTP_LENGTH_COPY) {
        if (pattern.test(text)) {
          violations.push(`${rel}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
