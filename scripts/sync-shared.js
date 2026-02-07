/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Sync shared code from this repo (helvety.com) to helvety-auth, helvety-store, helvety-pdf, helvety-tasks.
 *
 * Source of truth: this repo. Run from helvety.com root: node scripts/sync-shared.js
 *
 * Options:
 *   --dry-run    Preview changes without copying files
 *
 * Synced paths (must match .cursor/rules/shared-code-patterns.mdc):
 *   - proxy.ts
 *   - scripts/generate-version.js
 *   - lib/utils.ts, lib/logger.ts, lib/constants.ts (helvety-auth, helvety-store, helvety-tasks only; helvety-pdf keeps app-specific constants)
 *   - lib/auth-errors.ts, lib/auth-logger.ts, lib/auth-redirect.ts, lib/rate-limit.ts, lib/csrf.ts
 *   - lib/auth-guard.ts (helvety-store, helvety-pdf, helvety-tasks only; helvety-auth keeps its own with local redirect)
 *   - lib/redirect-validation.ts
 *   - lib/types/entities.ts (shared entity types)
 *   - lib/crypto/* (entire directory)
 *   - hooks/use-auth-session.ts (helvety-store, helvety-pdf, helvety-tasks only; helvety-auth keeps its own)
 *   - app/error.tsx (global error boundary)
 *   - app/not-found.tsx (global 404 page)
 *   - components/cookie-notice.tsx, components/theme-provider.tsx, components/theme-switcher.tsx, components/app-switcher.tsx
 *   - .cursor/rules/* (coding standards and patterns)
 *   - .prettierrc, .prettierignore, .gitignore, postcss.config.mjs, eslint.config.mjs (tooling configs)
 */
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const SOURCE_ROOT = path.join(__dirname, "..");
const TARGET_REPOS = [
  "helvety-auth",
  "helvety-store",
  "helvety-pdf",
  "helvety-tasks",
];

const FILES = [
  // Tooling configs
  ".prettierrc",
  ".prettierignore",
  ".gitignore",
  "postcss.config.mjs",
  "eslint.config.mjs",
  // Shared source files
  "proxy.ts",
  "scripts/generate-version.js",
  "lib/utils.ts",
  "lib/logger.ts",
  "lib/constants.ts",
  "lib/auth-errors.ts",
  "lib/auth-logger.ts",
  "lib/auth-redirect.ts",
  "lib/auth-guard.ts",
  "lib/redirect-validation.ts",
  "lib/rate-limit.ts",
  "lib/csrf.ts",
  "lib/types/entities.ts",
  "hooks/use-auth-session.ts",
  "app/error.tsx",
  "app/not-found.tsx",
  "components/cookie-notice.tsx",
  "components/theme-provider.tsx",
  "components/theme-switcher.tsx",
  "components/app-switcher.tsx",
];

const DIRS = ["lib/crypto", ".cursor/rules"];

/**
 * Files to skip per target
 * - helvety-pdf keeps its own lib/constants.ts with app-specific exports
 * - helvety-auth keeps its own lib/auth-guard.ts (redirects to local /login instead of auth service)
 * - helvety-auth keeps its own hooks/use-auth-session.ts (no redirect, idle timeout disabled)
 * - helvety-tasks keeps its own lib/crypto/index.ts (re-exports task-encryption.ts functions)
 */
const TARGET_SKIP_FILES = {
  "helvety-pdf": ["lib/constants.ts"],
  "helvety-auth": ["lib/auth-guard.ts", "hooks/use-auth-session.ts"],
  "helvety-tasks": ["lib/crypto/index.ts"],
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
  for (const dir of DIRS) {
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

if (DRY_RUN) {
  console.log("\nDRY RUN MODE - No files will be modified\n");
}

// Validate source files first
validateSourceFiles();

const parentDir = path.join(SOURCE_ROOT, "..");
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
