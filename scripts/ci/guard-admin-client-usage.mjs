import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const rawAdminAllowedPaths = new Set([
  "apps/auth/app/actions/otp-actions.ts",
  "apps/auth/app/actions/passkey-auth-actions.test.ts",
  "apps/auth/app/actions/passkey-auth-actions.ts",
  "apps/auth/app/actions/user-lookup.ts",
  "apps/store/app/actions/download-actions.ts",
  "apps/store/app/api/webhooks/stripe/route.ts",
  "apps/store/lib/license/validation.ts",
  "apps/store/lib/packages/resolve-version.ts",
  "apps/tasks/app/actions/item-actions.ts",
  "packages/shared/src/supabase/admin.ts",
]);
const scopedRequiredPaths = new Set([
  "apps/auth/app/actions/auth-action-helpers.ts",
  "apps/auth/app/actions/credential-actions.ts",
  "apps/auth/app/actions/passkey-registration-actions.ts",
  "apps/store/app/actions/account-actions.ts",
  "apps/store/app/actions/subscription-actions.ts",
  "apps/store/app/api/checkout/route.ts",
]);

const root = resolve(process.cwd());
const importPath = "@helvety/shared/supabase/admin";
const excludedDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
]);

/**
 * Recursively collects .ts/.tsx files, skipping generated/heavy directories.
 *
 * @param {string} startDir
 * @returns {string[]}
 */
function collectTypeScriptFiles(startDir) {
  const matches = [];
  const entries = readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(startDir, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirectories.has(entry.name)) {
        continue;
      }
      matches.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      matches.push(fullPath);
    }
  }

  return matches;
}

const files = collectTypeScriptFiles(root);
const normalizedFiles = [];
for (const file of files) {
  const contents = readFileSync(file, "utf8");
  if (!contents.includes(importPath)) {
    continue;
  }
  normalizedFiles.push(relative(root, file).replaceAll("\\", "/"));
}

const unauthorizedRawAdmin = [];
const missingScopedAdmin = [];

for (const file of normalizedFiles) {
  const fullPath = resolve(root, file);
  const contents = readFileSync(fullPath, "utf8");
  const usesRawAdminClient = /\bcreateAdminClient\b/.test(contents);
  const usesScopedAdmin = /\bcreateScopedAdminQuery\b/.test(contents);

  if (usesRawAdminClient && !rawAdminAllowedPaths.has(file)) {
    unauthorizedRawAdmin.push(file);
  }

  if (scopedRequiredPaths.has(file) && !usesScopedAdmin) {
    missingScopedAdmin.push(file);
  }
}

if (unauthorizedRawAdmin.length > 0) {
  console.error(
    "Unauthorized raw createAdminClient usage detected (exception files only):"
  );
  for (const file of unauthorizedRawAdmin) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

if (missingScopedAdmin.length > 0) {
  console.error(
    "Missing createScopedAdminQuery usage in required user-context files:"
  );
  for (const file of missingScopedAdmin) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Admin client usage guard passed.");
