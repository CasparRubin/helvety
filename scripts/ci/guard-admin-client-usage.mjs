import { execSync } from "node:child_process";
import { resolve } from "node:path";

const allowedImportPaths = new Set([
  "apps/auth/app/actions/auth-action-helpers.ts",
  "apps/auth/app/actions/credential-actions.ts",
  "apps/auth/app/actions/otp-actions.ts",
  "apps/auth/app/actions/passkey-auth-actions.ts",
  "apps/auth/app/actions/passkey-auth-actions.test.ts",
  "apps/auth/app/actions/passkey-registration-actions.ts",
  "apps/auth/app/actions/user-lookup.ts",
  "apps/store/app/actions/account-actions.ts",
  "apps/store/app/actions/download-actions.ts",
  "apps/store/app/actions/subscription-actions.ts",
  "apps/store/app/api/checkout/route.ts",
  "apps/store/app/api/webhooks/stripe/route.ts",
  "apps/store/lib/license/validation.ts",
  "apps/store/lib/packages/resolve-version.ts",
  "apps/tasks/app/actions/attachment-actions.ts",
  "apps/tasks/lib/attachment-logger.ts",
  "packages/shared/src/supabase/admin.ts",
]);

const root = resolve(process.cwd());
const command =
  'rg --files-with-matches --glob "**/*.{ts,tsx}" "@helvety/shared/supabase/admin"';

let files = [];
try {
  const output = execSync(command, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();
  files = output ? output.split(/\r?\n/).filter(Boolean) : [];
} catch (error) {
  // rg exits with code 1 on no matches.
  const status = typeof error === "object" && error ? error.status : undefined;
  if (status !== 1) {
    throw error;
  }
}

const normalizedFiles = files.map((file) => file.replaceAll("\\", "/"));
const unauthorized = normalizedFiles.filter(
  (file) => !allowedImportPaths.has(file)
);
if (unauthorized.length > 0) {
  console.error("Unauthorized createAdminClient imports detected:");
  for (const file of unauthorized) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Admin client usage guard passed.");
