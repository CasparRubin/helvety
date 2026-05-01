import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

const filesToCheck = [
  "apps/contacts/app/actions/batch-actions.ts",
  "apps/notes/app/actions/batch-actions.ts",
  "apps/tasks/app/actions/batch-actions.ts",
  "apps/auth/lib/login-email-bootstrap.ts",
  "apps/auth/app/actions/otp-actions.ts",
  "apps/store/lib/rate-limit.ts",
  "apps/store/app/actions/download-actions.ts",
  "apps/store/app/actions/account-actions.ts",
  "apps/tasks/app/actions/entity-actions.ts",
  "apps/notes/app/actions/entity-actions.ts",
  "apps/contacts/app/actions/contact-actions.ts",
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/impressum/page.tsx",
  "apps/web/public/.well-known/security.txt",
];

async function main() {
  const contents = await Promise.all(
    filesToCheck.map(async (relativePath) => ({
      relativePath,
      content: await readFile(resolve(rootDir, relativePath), "utf8"),
    }))
  );

  for (const file of contents.slice(0, 3)) {
    if (/const\s+MAX_DASHBOARD_ROWS\s*=/.test(file.content)) {
      throw new Error(
        `${file.relativePath} must use ACTION_LIMITS.MAX_DASHBOARD_ROWS instead of local MAX_DASHBOARD_ROWS constants.`
      );
    }
  }

  const loginBootstrap = contents.find((item) =>
    item.relativePath.endsWith("login-email-bootstrap.ts")
  );
  if (
    loginBootstrap &&
    /step:\s*"encryption-setup"\s*\|\s*"passkey-signin"/.test(
      loginBootstrap.content
    )
  ) {
    throw new Error(
      "apps/auth/lib/login-email-bootstrap.ts must use RequiredAuthStep instead of an inline auth-step union."
    );
  }

  const otpActions = contents.find((item) =>
    item.relativePath.endsWith("otp-actions.ts")
  );
  if (
    otpActions &&
    /nextStep:\s*"encryption-setup"\s*\|\s*"passkey-signin"/.test(
      otpActions.content
    )
  ) {
    throw new Error(
      "apps/auth/app/actions/otp-actions.ts must use RequiredAuthStep instead of an inline auth-step union."
    );
  }

  const legalCommentTargets = contents.filter((item) =>
    /app\/actions\/(account-actions|entity-actions|contact-actions)\.ts$/.test(
      item.relativePath
    )
  );
  for (const file of legalCommentTargets) {
    if (/Legal basis:\s*nDSG/i.test(file.content)) {
      throw new Error(
        `${file.relativePath} should not encode statutory legal-basis interpretations in implementation comments. Reference product legal docs instead.`
      );
    }
  }

  const storeRateLimit = contents.find((item) =>
    item.relativePath.endsWith("apps/store/lib/rate-limit.ts")
  );
  if (
    storeRateLimit &&
    !/Signed download URL generation:\s*10 per minute per IP/.test(
      storeRateLimit.content
    )
  ) {
    throw new Error(
      "apps/store/lib/rate-limit.ts must document DOWNLOAD_URL as per IP to match implementation."
    );
  }

  const downloadActions = contents.find((item) =>
    item.relativePath.endsWith("apps/store/app/actions/download-actions.ts")
  );
  if (
    downloadActions &&
    !/`download_url:ip:\$\{clientIp\}`/.test(downloadActions.content)
  ) {
    throw new Error(
      "apps/store/app/actions/download-actions.ts must enforce DOWNLOAD_URL throttling with an IP-scoped key."
    );
  }

  const legalPages = contents.filter((item) =>
    /apps\/web\/app\/(privacy|terms|impressum)\/page\.tsx$/.test(
      item.relativePath
    )
  );
  const reviewedDates = legalPages.map((file) => {
    const match = file.content.match(/lastReviewed=\"([^\"]+)\"/);
    if (!match) {
      throw new Error(`${file.relativePath} must define a lastReviewed value.`);
    }
    return match[1];
  });
  if (new Set(reviewedDates).size !== 1) {
    throw new Error(
      "Legal pages must share the same lastReviewed value to avoid policy-date drift."
    );
  }

  const securityTxt = contents.find((item) =>
    item.relativePath.endsWith("apps/web/public/.well-known/security.txt")
  );
  if (securityTxt) {
    const expiresMatch = securityTxt.content.match(/^Expires:\s*(.+)$/m);
    if (!expiresMatch) {
      throw new Error(
        "apps/web/public/.well-known/security.txt must include an Expires field."
      );
    }
    const expiresDate = new Date(expiresMatch[1].trim());
    const now = new Date();
    if (Number.isNaN(expiresDate.getTime())) {
      throw new Error("security.txt Expires must be a valid ISO timestamp.");
    }
    const maxAheadMs = 370 * 24 * 60 * 60 * 1000;
    if (expiresDate.getTime() - now.getTime() > maxAheadMs) {
      throw new Error(
        "security.txt Expires is too far in the future; keep it within roughly 12 months."
      );
    }
  }

  console.log("Consistency guardrail checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
