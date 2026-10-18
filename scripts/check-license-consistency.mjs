/**
 * Ensures the monorepo LICENSE is AGPL-3.0-or-later, customer licensing copy
 * states that Helvety first-party product repositories share that SPDX, and
 * stale MIT / mixed-license product-line claims are gone.
 *
 * Run: `bun run consistency:license`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FORBIDDEN = [
  {
    label: "blanket AGPL claim for all Helvety products",
    re: /All Helvety products with published source are released under AGPL-3\.0 or later/i,
  },
  {
    label: "old separate repo AGPL claim",
    re: /where source is published for those products,\s+it is\s+\*\*AGPL-3\.0-licensed\*\*/i,
  },
  {
    label: "AGPL for browser extensions desktop tools etc",
    re: /browser extensions,\s*SharePoint solutions,\s*and desktop tools distributed outside this repository\).*AGPL-3\.0/i,
  },
  {
    label: "shared AGPL feature constant name",
    re: /\bHELVETY_FREE_AGPL_(FEATURE|INLINE)\b/,
  },
];

const SCAN_ROOTS = ["apps", "packages", "scripts", "docs", "README.md"];
const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".txt",
  ".mjs",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "ort",
]);

function collectFiles(entryPath) {
  const stat = statSync(entryPath);
  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.has(path.extname(entryPath))) {
      return [entryPath];
    }
    return [];
  }
  if (!stat.isDirectory()) {
    return [];
  }
  if (SKIP_DIRS.has(path.basename(entryPath))) {
    return [];
  }
  const files = [];
  for (const name of readdirSync(entryPath)) {
    files.push(...collectFiles(path.join(entryPath, name)));
  }
  return files;
}

function scanPaths() {
  const files = [];
  for (const rel of SCAN_ROOTS) {
    const abs = path.join(root, rel);
    const stat = statSync(abs);
    if (stat.isFile()) {
      if (SCAN_EXTENSIONS.has(path.extname(abs))) {
        files.push(abs);
      }
      continue;
    }
    files.push(...collectFiles(abs));
  }
  return [...new Set(files)];
}

function checkLicenseFile() {
  const licensePath = path.join(root, "LICENSE");
  const text = readFileSync(licensePath, "utf8");
  if (!text.includes("GNU AFFERO GENERAL PUBLIC LICENSE")) {
    console.error(
      "LICENSE must contain the GNU AFFERO GENERAL PUBLIC LICENSE text."
    );
    return false;
  }
  if (!text.includes("Copyright (C) 2026 Helvety by Rubin")) {
    console.error("LICENSE must include the Helvety copyright notice.");
    return false;
  }
  return true;
}

function checkForbiddenReferences() {
  const violations = [];
  const skipFiles = new Set([
    path.join(root, "scripts/check-license-consistency.mjs"),
    path.join(root, "packages/shared/src/customer-copy-guardrails.ts"),
    path.join(root, "LICENSE"),
  ]);

  for (const filePath of scanPaths()) {
    if (skipFiles.has(filePath)) {
      continue;
    }
    const rel = path.relative(root, filePath);
    if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) {
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    for (const { label, re } of FORBIDDEN) {
      if (re.test(content)) {
        violations.push({ rel, label });
      }
    }
  }

  if (violations.length > 0) {
    console.error("Forbidden legacy license references found:");
    for (const { rel, label } of violations) {
      console.error(`  ${rel} (${label})`);
    }
    return false;
  }
  return true;
}

function checkRequiredAgplProductLineDisclosure() {
  const requiredFiles = [
    "packages/shared/src/licensing.ts",
    "apps/web/public/llms.txt",
    "apps/store/public/llms.txt",
    "apps/web/app/terms/page.tsx",
    "apps/web/app/impressum/page.tsx",
  ];

  const requiredPhrases = [
    /AGPL-3\.0-or-later|HELVETY_MONOREPO_SOURCE_LICENSE_LEGAL_NAME/,
    /repository(?:&apos;s|'s)? LICENSE|repository LICENSE file|release source link/i,
  ];

  const forbiddenProductLinePhrases = [
    /AGPL-3\.0-or-later or MIT/i,
    /including MIT/i,
    /may use different open-source licenses/i,
  ];

  const missing = [];
  const forbiddenHits = [];
  for (const rel of requiredFiles) {
    const abs = path.join(root, rel);
    const content = readFileSync(abs, "utf8");
    for (const re of requiredPhrases) {
      if (!re.test(content)) {
        missing.push(`${rel} (missing ${re})`);
      }
    }
    for (const re of forbiddenProductLinePhrases) {
      if (re.test(content)) {
        forbiddenHits.push(`${rel} (forbidden ${re})`);
      }
    }
  }

  if (missing.length > 0) {
    console.error("Required AGPL product-line disclosures are missing:");
    for (const item of missing) {
      console.error(`  ${item}`);
    }
  }
  if (forbiddenHits.length > 0) {
    console.error("Stale MIT / mixed-license product-line claims found:");
    for (const item of forbiddenHits) {
      console.error(`  ${item}`);
    }
  }
  return missing.length === 0 && forbiddenHits.length === 0;
}

function checkNoPerAppLicenseDuplicates() {
  const appsDir = path.join(root, "apps");
  const duplicates = [];
  for (const app of readdirSync(appsDir)) {
    const licensePath = path.join(appsDir, app, "LICENSE");
    try {
      if (statSync(licensePath).isFile()) {
        duplicates.push(path.relative(root, licensePath));
      }
    } catch {
      // no LICENSE in app dir
    }
  }
  if (duplicates.length > 0) {
    console.error(
      "Per-app LICENSE files should be removed; use the root LICENSE only:"
    );
    for (const rel of duplicates) {
      console.error(`  ${rel}`);
    }
    return false;
  }
  return true;
}

function main() {
  const ok =
    checkLicenseFile() &&
    checkForbiddenReferences() &&
    checkRequiredAgplProductLineDisclosure() &&
    checkNoPerAppLicenseDuplicates();
  if (!ok) {
    process.exit(1);
  }
  console.log(
    "license consistency OK (AGPL-3.0-or-later product line, no stale MIT claims)"
  );
}

main();
