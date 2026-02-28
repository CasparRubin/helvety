#!/usr/bin/env node
/**
 * CI guard: blocks deprecated/legacy patterns from being reintroduced.
 * See docs/deprecation-audit-report.md for the full audit and rationale.
 *
 * Checks:
 * - No middleware.ts (Next.js 16: use proxy.ts)
 * - No createSessionRefreshProxy (removed alias; use createSecurityProxy)
 * - No @supabase/auth-helpers-* (deprecated; use @supabase/ssr)
 * - No React 19 removed APIs (findDOMNode, ReactDOM.render, etc.)
 * - No Next.js Pages Router data methods (getServerSideProps, etc.)
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";

const root = resolve(process.cwd());
const excludedDirs = new Set([
  ".git",
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
]);

/** Forbidden code patterns: { regex, reason } */
const forbiddenPatterns = [
  {
    pattern: /createSessionRefreshProxy/,
    reason: "Removed; use createSecurityProxy",
  },
  {
    pattern: /@supabase\/auth-helpers(-\w+)?/,
    reason: "Deprecated; use @supabase/ssr",
  },
  {
    pattern: /findDOMNode/,
    reason: "React 19 removed findDOMNode; use refs",
  },
  {
    pattern: /ReactDOM\.render\s*\(/,
    reason: "React 19 removed; use createRoot",
  },
  {
    pattern: /ReactDOM\.hydrate\s*\(/,
    reason: "React 19 removed; use hydrateRoot",
  },
  {
    pattern: /unmountComponentAtNode/,
    reason: "React 19 removed; use root.unmount()",
  },
  {
    pattern: /contextTypes\s*[:=]/,
    reason: "React 19 removed legacy context; use createContext",
  },
  {
    pattern: /childContextTypes\s*[:=]/,
    reason: "React 19 removed legacy context; use createContext",
  },
  {
    pattern: /getChildContext\s*\(/,
    reason: "React 19 removed legacy context; use createContext",
  },
  {
    pattern: /from\s+["']react-dom\/test-utils["']/,
    reason: "React 19: import act from 'react'",
  },
  {
    pattern: /from\s+["']react-test-renderer\/shallow["']/,
    reason: "React 19: use react-shallow-renderer or @testing-library/react",
  },
  {
    pattern: /createFactory\s*\(/,
    reason: "React 19 removed createFactory; use JSX",
  },
  {
    pattern: /getServerSideProps|getStaticProps|getInitialProps/,
    reason: "Pages Router data methods; use App Router",
  },
  {
    pattern: /from\s+["']next\/head["']/,
    reason: "Use metadata / generateMetadata",
  },
];

function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      results.push(...collectFiles(full));
      continue;
    }
    if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const violations = [];

// 1. Check for forbidden file names (middleware.ts deprecated in Next.js 16)
const appDirs = [
  "apps/web",
  "apps/auth",
  "apps/store",
  "apps/pdf",
  "apps/tasks",
  "apps/contacts",
];
for (const dir of [...appDirs, "src", "."]) {
  const filePath =
    dir === "."
      ? resolve(root, "middleware.ts")
      : resolve(root, dir, "middleware.ts");
  if (existsSync(filePath)) {
    violations.push({
      file: relative(root, filePath),
      reason: "Next.js 16: use proxy.ts instead of middleware.ts",
    });
  }
}

// 2. Scan code for forbidden patterns
const files = collectFiles(root);
for (const filePath of files) {
  const rel = relative(root, filePath).replaceAll("\\", "/");
  // Skip our own guard scripts and generated files
  if (rel.includes("guard-deprecated") || rel.includes("bun.lock")) continue;
  const content = readFileSync(filePath, "utf8");
  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(content)) {
      const lineNum = content.split("\n").findIndex((l) => pattern.test(l)) + 1;
      violations.push({ file: rel, reason, line: lineNum || undefined });
    }
  }
}

if (violations.length > 0) {
  console.error("❌ Deprecated pattern guard failed.");
  console.error(
    "Found deprecated/legacy patterns (see docs/deprecation-audit-report.md):\n"
  );
  for (const v of violations) {
    console.error(`  ${v.file}${v.line ? `:${v.line}` : ""}`);
    console.error(`    → ${v.reason}`);
  }
  process.exit(1);
}

console.log("✅ Deprecated pattern guard passed.");
