/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sync shared code from this repo (helvety.com) to helvety-auth, helvety-store, helvety-pdf, helvety-tasks, helvety-contacts.
 *
 * Source of truth: this repo. Run from helvety.com root: node scripts/sync-shared.js
 *
 * Options:
 *   --dry-run    Preview changes without copying files
 *   --check      Compare files only; exit 1 if any have drifted
 *
 * Synced paths (must match .cursor/rules/shared-code-patterns.mdc):
 *   - proxy.ts (all except helvety-auth which adds CSRF token generation for auth server actions)
 *   - scripts/generate-version.mjs
 *   - lib/utils.ts, lib/logger.ts, lib/constants.ts (helvety-auth, helvety-store, helvety-tasks, helvety-contacts; helvety-pdf and helvety-contacts keep app-specific constants)
 *   - lib/auth-logger.ts, lib/auth-redirect.ts, lib/auth-retry.ts
 *   - lib/csrf.ts (all except helvety-auth which has auth-specific CSRF lifecycle, and helvety-pdf which has no server actions)
 *   - lib/auth-guard.ts (helvety-store, helvety-tasks, helvety-contacts; helvety-auth keeps its own with local redirect; helvety-pdf does not use it)
 *   - lib/redirect-validation.ts
 *   - lib/rate-limit.ts (helvety-pdf only; helvety-store, helvety-auth, helvety-tasks, helvety-contacts keep app-specific rate limits)
 *   - lib/env-validation.ts (all except helvety-store which adds Stripe key validation)
 *   - lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/client-factory.ts
 *   - lib/types/entities.ts (helvety-auth, helvety-tasks, helvety-contacts only; helvety-store and helvety-pdf keep their own without encryption types)
 *   - lib/crypto/* (helvety-auth, helvety-tasks, helvety-contacts only; helvety-store and helvety-pdf do not use E2EE)
 *   - app/globals.css (shared design system; helvety-pdf keeps its own with custom grid utilities)
 *   - app/error.tsx (global error boundary)
 *   - app/not-found.tsx (global 404 page)
 *   - components/theme-provider.tsx, components/theme-switcher.tsx, components/app-switcher.tsx
 *   - components/auth-token-handler.tsx (helvety-store, helvety-tasks, helvety-contacts, helvety-pdf; helvety-auth keeps its own with passkey logic)
 *   - lib/dates.ts, lib/dates.test.ts (helvety-tasks, helvety-contacts only; other repos do not use date formatting)
 *   - vitest.config.ts, vitest.setup.ts, vitest.server-only-mock.ts (test infrastructure)
 *   - .cursor/rules/* (coding standards and patterns)
 *   - tsconfig.json, .prettierrc, .prettierignore, .gitignore, postcss.config.mjs, eslint.config.mjs (tooling configs)
 */
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CHECK_MODE = args.includes("--check");

const SOURCE_ROOT = path.join(__dirname, "..");
const TARGET_REPOS = [
  "helvety-auth",
  "helvety-store",
  "helvety-pdf",
  "helvety-tasks",
  "helvety-contacts",
];

const FILES = [
  // Tooling configs
  "tsconfig.json",
  ".prettierrc",
  ".prettierignore",
  ".gitignore",
  "postcss.config.mjs",
  "eslint.config.mjs",
  // Test infrastructure
  "vitest.config.ts",
  "vitest.setup.ts",
  "vitest.server-only-mock.ts",
  // Shared source files
  "proxy.ts",
  "scripts/generate-version.mjs",
  "lib/utils.ts",
  "lib/logger.ts",
  "lib/constants.ts",
  "lib/auth-logger.ts",
  "lib/auth-redirect.ts",
  "lib/auth-guard.ts",
  "lib/auth-retry.ts",
  "lib/redirect-validation.ts",
  "lib/dates.ts",
  "lib/dates.test.ts",
  "lib/rate-limit.ts",
  "lib/csrf.ts",
  "lib/env-validation.ts",
  "lib/supabase/client.ts",
  "lib/supabase/server.ts",
  "lib/supabase/client-factory.ts",
  "lib/types/entities.ts",
  // Shared design system
  "app/globals.css",
  "app/error.tsx",
  "app/not-found.tsx",
  "components/theme-provider.tsx",
  "components/theme-switcher.tsx",
  "components/app-switcher.tsx",
  "components/auth-token-handler.tsx",
];

const DIRS = ["lib/crypto", ".cursor/rules"];

/**
 * Files to skip per target
 * - helvety-pdf keeps its own lib/constants.ts with app-specific exports
 * - helvety-pdf keeps its own lib/types/entities.ts (no encryption types; E2EE not used)
 * - helvety-pdf does not use lib/dates.ts (no date formatting in PDF toolkit)
 * - helvety-pdf does not use auth-guard.ts (no login required; client-side-only PDF processing)
 * - helvety-pdf does not use csrf.ts (no server actions requiring CSRF protection)
 * - helvety-pdf keeps its own app/globals.css (adds custom responsive grid utilities)
 * - helvety-auth does not use lib/dates.ts (no date formatting in auth flows)
 * - helvety-auth keeps its own lib/auth-guard.ts (redirects to local /login instead of auth service)
 * - helvety-auth keeps its own components/auth-token-handler.tsx (includes passkey verification logic)
 * - helvety-auth keeps its own proxy.ts (adds CSRF token generation for auth server actions)
 * - helvety-auth keeps its own lib/csrf.ts (auth-specific CSRF lifecycle with proxy.ts)
 * - helvety-auth keeps its own lib/rate-limit.ts (auth-specific rate limits: PASSKEY, OTP, OTP_VERIFY)
 * - helvety-store does not use lib/dates.ts (no date formatting in store)
 * - helvety-store keeps its own lib/env-validation.ts (includes Stripe key validation)
 * - helvety-store keeps its own lib/types/entities.ts (no encryption types; E2EE not used)
 * - helvety-store keeps its own lib/rate-limit.ts (store-specific rate limits: CHECKOUT, DOWNLOADS, etc.)
 * - helvety-tasks keeps its own lib/constants.ts (adds attachment constants)
 * - helvety-tasks keeps its own lib/crypto/index.ts (re-exports task-encryption.ts functions)
 * - helvety-tasks keeps its own lib/crypto/encryption.ts (adds buildAAD and binary encryption for attachments)
 * - helvety-tasks keeps its own lib/rate-limit.ts (task-specific rate limits: ENCRYPTION_UNLOCK, READ)
 * - helvety-contacts keeps its own lib/constants.ts (no attachment constants)
 * - helvety-contacts keeps its own lib/crypto/index.ts (no task-encryption re-exports)
 * - helvety-contacts keeps its own lib/auth-redirect.ts (app-specific fallback URLs for dev/prod)
 * - helvety-contacts keeps its own lib/rate-limit.ts (contact-specific rate limits: ENCRYPTION_UNLOCK, READ)
 * - .cursor/rules/supabase-database.mdc is skipped for ALL targets (only helvety.com has the supabase/ folder)
 */
const TARGET_SKIP_FILES = {
  "helvety-pdf": [
    "lib/constants.ts",
    "lib/types/entities.ts",
    "lib/auth-guard.ts",
    "lib/csrf.ts",
    "lib/dates.ts",
    "lib/dates.test.ts",
    "app/globals.css",
    ".cursor/rules/supabase-database.mdc",
  ],
  "helvety-auth": [
    "proxy.ts",
    "lib/auth-guard.ts",
    "components/auth-token-handler.tsx",
    "lib/csrf.ts",
    "lib/dates.ts",
    "lib/dates.test.ts",
    "lib/rate-limit.ts",
    ".cursor/rules/supabase-database.mdc",
  ],
  "helvety-store": [
    "lib/env-validation.ts",
    "lib/types/entities.ts",
    "lib/dates.ts",
    "lib/dates.test.ts",
    "lib/rate-limit.ts",
    ".cursor/rules/supabase-database.mdc",
  ],
  "helvety-tasks": [
    "lib/constants.ts",
    "lib/crypto/index.ts",
    "lib/crypto/encryption.ts",
    "lib/rate-limit.ts",
    ".cursor/rules/supabase-database.mdc",
  ],
  "helvety-contacts": [
    "lib/constants.ts",
    "lib/crypto/index.ts",
    "lib/auth-redirect.ts",
    "lib/rate-limit.ts",
    ".cursor/rules/supabase-database.mdc",
  ],
};

/**
 * Directories to skip entirely per target
 * - helvety-store does not use E2EE; lib/crypto/ was removed
 * - helvety-pdf does not use E2EE; lib/crypto/ was removed
 * - Only helvety-auth, helvety-tasks, and helvety-contacts receive lib/crypto/
 */
const TARGET_SKIP_DIRS = {
  "helvety-store": ["lib/crypto"],
  "helvety-pdf": ["lib/crypto"],
};

// Track statistics for reporting
const stats = {
  copied: 0,
  skipped: 0,
  missing: 0,
  differs: 0,
  errors: [],
};

/**
 * Check if a file path is within the specified parent directory
 * Prevents path traversal attacks by ensuring resolved paths stay within expected boundaries
 */
function isPathWithin(filePath, parentDir) {
  const resolvedPath = path.resolve(filePath);
  const resolvedParent = path.resolve(parentDir);
  return (
    resolvedPath.startsWith(resolvedParent + path.sep) ||
    resolvedPath === resolvedParent
  );
}

/**
 * Compare two files and return true if they are identical
 */
function filesAreIdentical(file1, file2) {
  try {
    const content1 = fs.readFileSync(file1);
    const content2 = fs.readFileSync(file2);
    return content1.equals(content2);
  } catch {
    return false;
  }
}

/**
 * Check a single file for drift between source and target
 */
function checkFile(srcRoot, destRoot, file, targetRepo) {
  const skipList = TARGET_SKIP_FILES[targetRepo];
  if (skipList && skipList.includes(file)) {
    return null; // skipped, not a drift
  }

  const src = path.join(srcRoot, file);
  const dest = path.join(destRoot, file);

  if (!fs.existsSync(src)) {
    return null; // source missing, skip
  }

  if (!fs.existsSync(dest)) {
    return file; // target missing = drift
  }

  if (!filesAreIdentical(src, dest)) {
    return file; // content differs = drift
  }

  return null; // identical
}

/**
 * Check a directory recursively for drift
 */
function checkDirRecursive(srcRoot, destRoot, dir, targetRepo) {
  const srcDir = path.join(srcRoot, dir);
  const drifted = [];

  if (!fs.existsSync(srcDir)) {
    return drifted;
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = path.join(dir, entry.name).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      drifted.push(
        ...checkDirRecursive(srcRoot, destRoot, relativePath, targetRepo)
      );
    } else {
      const result = checkFile(srcRoot, destRoot, relativePath, targetRepo);
      if (result) {
        drifted.push(result);
      }
    }
  }

  return drifted;
}

/**
 * Check a single repo for drift and return list of drifted files
 */
function checkRepo(targetRoot, targetRepo) {
  const drifted = [];

  for (const file of FILES) {
    const result = checkFile(SOURCE_ROOT, targetRoot, file, targetRepo);
    if (result) {
      drifted.push(result);
    }
  }

  const skipDirs = TARGET_SKIP_DIRS[targetRepo] || [];
  for (const dir of DIRS) {
    if (skipDirs.includes(dir)) {
      continue; // entire directory skipped for this target
    }
    drifted.push(
      ...checkDirRecursive(SOURCE_ROOT, targetRoot, dir, targetRepo)
    );
  }

  return drifted;
}

/**
 * Validate that all source files exist before syncing
 */
function validateSourceFiles() {
  const missing = [];

  for (const file of FILES) {
    const src = path.join(SOURCE_ROOT, file);
    if (!fs.existsSync(src)) {
      missing.push(file);
    }
  }

  for (const dir of DIRS) {
    const srcDir = path.join(SOURCE_ROOT, dir);
    if (!fs.existsSync(srcDir)) {
      missing.push(`${dir}/`);
    }
  }

  if (missing.length > 0) {
    console.error("\nValidation failed! Missing source files:");
    missing.forEach((f) => console.error(`  - ${f}`));
    console.error("\nFix these issues before syncing.\n");
    process.exit(1);
  }

  console.log("Source validation passed.\n");
}

function copyFile(srcRoot, destRoot, file, targetRepo) {
  const skipList = TARGET_SKIP_FILES[targetRepo];
  if (skipList && skipList.includes(file)) {
    console.log(`  Skip (target-specific): ${file}`);
    stats.skipped++;
    return;
  }

  const src = path.join(srcRoot, file);
  const dest = path.join(destRoot, file);

  if (!fs.existsSync(src)) {
    console.warn(`  Missing: ${file}`);
    stats.missing++;
    return;
  }

  // Check if target exists and differs
  if (fs.existsSync(dest) && !filesAreIdentical(src, dest)) {
    console.log(`  Differs (will overwrite): ${file}`);
    stats.differs++;
  }

  // Path traversal protection: ensure paths stay within expected directories
  if (!isPathWithin(src, srcRoot)) {
    console.error(`  Error: Source path traversal detected for ${file}`);
    stats.errors.push({
      file,
      error: "Source path outside expected directory",
    });
    return;
  }
  if (!isPathWithin(dest, destRoot)) {
    console.error(`  Error: Destination path traversal detected for ${file}`);
    stats.errors.push({
      file,
      error: "Destination path outside expected directory",
    });
    return;
  }

  if (DRY_RUN) {
    console.log(`  Would copy: ${file}`);
    stats.copied++;
    return;
  }

  try {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
    stats.copied++;
  } catch (err) {
    console.error(`  Error copying ${file}: ${err.message}`);
    stats.errors.push({ file, error: err.message });
  }
}

function copyDirRecursive(srcRoot, destRoot, dir, targetRepo) {
  const srcDir = path.join(srcRoot, dir);
  const destDir = path.join(destRoot, dir);

  if (!fs.existsSync(srcDir)) {
    console.warn(`  Missing directory: ${dir}/`);
    stats.missing++;
    return;
  }

  if (!DRY_RUN && !fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relativePath = path.join(dir, entry.name).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      copyDirRecursive(srcRoot, destRoot, relativePath, targetRepo);
    } else {
      // Check if this file should be skipped for this target
      const skipList = TARGET_SKIP_FILES[targetRepo];
      if (skipList && skipList.includes(relativePath)) {
        console.log(`  Skip (target-specific): ${relativePath}`);
        stats.skipped++;
        continue;
      }

      // Check if target exists and differs
      if (fs.existsSync(destPath) && !filesAreIdentical(srcPath, destPath)) {
        console.log(`  Differs (will overwrite): ${relativePath}`);
        stats.differs++;
      }

      // Path traversal protection: ensure paths stay within expected directories
      if (!isPathWithin(srcPath, srcRoot)) {
        console.error(
          `  Error: Source path traversal detected for ${relativePath}`
        );
        stats.errors.push({
          file: relativePath,
          error: "Source path outside expected directory",
        });
        continue;
      }
      if (!isPathWithin(destPath, destRoot)) {
        console.error(
          `  Error: Destination path traversal detected for ${relativePath}`
        );
        stats.errors.push({
          file: relativePath,
          error: "Destination path outside expected directory",
        });
        continue;
      }

      if (DRY_RUN) {
        console.log(`  Would copy: ${relativePath}`);
        stats.copied++;
      } else {
        try {
          fs.copyFileSync(srcPath, destPath);
          console.log(`  Copied: ${relativePath}`);
          stats.copied++;
        } catch (err) {
          console.error(`  Error copying ${relativePath}: ${err.message}`);
          stats.errors.push({ file: relativePath, error: err.message });
        }
      }
    }
  }
}

function resetStats() {
  stats.copied = 0;
  stats.skipped = 0;
  stats.missing = 0;
  stats.differs = 0;
  stats.errors = [];
}

function syncTo(targetRoot, targetRepo) {
  resetStats();

  for (const file of FILES) {
    copyFile(SOURCE_ROOT, targetRoot, file, targetRepo);
  }
  const skipDirs = TARGET_SKIP_DIRS[targetRepo] || [];
  for (const dir of DIRS) {
    if (skipDirs.includes(dir)) {
      console.log(`  Skip (target-specific dir): ${dir}/`);
      stats.skipped++;
      continue;
    }
    copyDirRecursive(SOURCE_ROOT, targetRoot, dir, targetRepo);
  }

  // Print summary for this repo
  console.log(`  ---`);
  console.log(
    `  Summary: ${stats.copied} ${DRY_RUN ? "would be copied" : "copied"}, ${stats.skipped} skipped, ${stats.differs} differed`
  );
  if (stats.errors.length > 0) {
    console.log(`  Errors: ${stats.errors.length}`);
  }
}

// Main execution
console.log("=".repeat(60));
console.log("Helvety Shared Code Sync");
console.log("=".repeat(60));

if (CHECK_MODE) {
  console.log("\nCHECK MODE - Comparing files for drift\n");
} else if (DRY_RUN) {
  console.log("\nDRY RUN MODE - No files will be modified\n");
}

// Validate source files first
validateSourceFiles();

const parentDir = path.join(SOURCE_ROOT, "..");

// --check mode: compare only, report drift, exit non-zero if any differ
if (CHECK_MODE) {
  let totalDrifted = 0;
  let reposWithDrift = 0;

  for (const repo of TARGET_REPOS) {
    const targetRoot = path.join(parentDir, repo);
    if (!fs.existsSync(targetRoot)) {
      console.warn(`Target not found: ${targetRoot}`);
      continue;
    }

    const drifted = checkRepo(targetRoot, repo);

    if (drifted.length > 0) {
      console.log(`${repo}: ${drifted.length} file(s) out of sync`);
      drifted.forEach((f) => console.log(`  ${f}`));
      console.log();
      totalDrifted += drifted.length;
      reposWithDrift++;
    } else {
      console.log(`${repo}: all in sync`);
    }
  }

  console.log("\n" + "=".repeat(60));
  if (totalDrifted > 0) {
    console.log(
      `FAILED: ${totalDrifted} file(s) out of sync across ${reposWithDrift} repo(s)`
    );
    console.log(
      "\nRun `node scripts/sync-shared.js` to fix, or `--dry-run` to preview."
    );
    process.exit(1);
  } else {
    console.log("OK: All shared files are in sync across all repos.");
    process.exit(0);
  }
}

// Normal sync mode (default or --dry-run)
let totalCopied = 0;
let totalSkipped = 0;
let totalDiffers = 0;
let totalErrors = 0;

for (const repo of TARGET_REPOS) {
  const targetRoot = path.join(parentDir, repo);
  if (!fs.existsSync(targetRoot)) {
    console.warn(`Target not found: ${targetRoot}`);
    continue;
  }
  console.log(`\nSyncing to ${repo}...`);
  syncTo(targetRoot, repo);
  totalCopied += stats.copied;
  totalSkipped += stats.skipped;
  totalDiffers += stats.differs;
  totalErrors += stats.errors.length;
}

// Final report
console.log("\n" + "=".repeat(60));
console.log("Final Report");
console.log("=".repeat(60));
console.log(
  `Total files ${DRY_RUN ? "would be copied" : "copied"}: ${totalCopied}`
);
console.log(`Total files skipped (target-specific): ${totalSkipped}`);
console.log(`Total files that differed: ${totalDiffers}`);
if (totalErrors > 0) {
  console.log(`Total errors: ${totalErrors}`);
}

if (DRY_RUN) {
  console.log("\nThis was a dry run. Run without --dry-run to apply changes.");
} else {
  console.log("\nDone. Run format/lint in each repo after syncing.");
}
