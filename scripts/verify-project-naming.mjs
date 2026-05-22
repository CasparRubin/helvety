/**
 * Fail the build if superseded Power Automate extension name strings appear outside
 * an explicit allowlist (Store redirects, redirect tests, ops README).
 *
 * Patterns mirror `power-platform-configurator-browser-extension-chromium/scripts/verify-project-naming.mjs`.
 *
 * Run: `bun run consistency:project-naming`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skipDirNames = new Set([
  "node_modules",
  "dist",
  ".git",
  ".next",
  ".turbo",
  "coverage",
]);

/** Paths that may contain legacy slugs only for redirects or negative tests. */
const allowlistPaths = new Set([
  "scripts/verify-project-naming.mjs",
  "docs/naming-conventions.md",
  "packages/shared/src/retired-power-platform-extension-naming.ts",
  "apps/store/next.config.ts",
  "apps/store/next.config.test.ts",
  "apps/store/README.md",
  "apps/store/app/actions/download-actions.test.ts",
  "apps/store/lib/packages/config.test.ts",
]);

/**
 * Keep in sync with `packages/shared/src/retired-power-platform-extension-naming.ts`.
 * @type {{ label: string; re: RegExp }[]}
 */
const forbidden = [
  { label: "legacy store slug editor-preference", re: /editor-preference/i },
  {
    label: "legacy repo slug power-automate-v3-false",
    re: /power-automate-v3-false/i,
  },
  {
    label: "legacy repo slug power_automate_v3_false",
    re: /power_automate_v3_false/i,
  },
  {
    label: "legacy package name power-automate-v3-enforcer",
    re: /power-automate-v3-enforcer/i,
  },
  {
    label: 'legacy display title "Power Automate v3 enforcer"',
    re: /Power Automate v3 enforcer/i,
  },
  {
    label: "retired repo slug power-automate-editor-version-enforcer",
    re: /power-automate-editor-version-enforcer/i,
  },
  {
    label: 'retired display title "Power Automate Editor Version Enforcer"',
    re: /Power Automate Editor Version Enforcer/i,
  },
  {
    label: "retired copy module power-automate-editor-enforcer-copy",
    re: /power-automate-editor-enforcer-copy/i,
  },
];

const scanExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".html",
  ".css",
  ".svg",
  ".yml",
  ".yaml",
  ".txt",
]);

const maxBytes = 512 * 1024;

/**
 * @param {string} dir
 * @param {string[]} hits
 */
function walk(dir, hits) {
  const names = readdirSync(dir);
  for (const name of names) {
    const full = join(dir, name);
    const rel = relative(root, full).replaceAll("\\", "/");
    if (allowlistPaths.has(rel)) continue;
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (skipDirNames.has(name)) continue;
      walk(full, hits);
      continue;
    }
    if (!st.isFile() || st.size > maxBytes) continue;
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot) : "";
    if (!scanExtensions.has(ext)) continue;
    let text;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const { label, re } of forbidden) {
      if (re.test(text)) {
        hits.push(`${rel}: contains ${label}`);
      }
    }
  }
}

const hits = [];
walk(root, hits);
if (hits.length > 0) {
  console.error(
    "verify-project-naming: forbidden superseded name strings found:\n" +
      hits.join("\n")
  );
  process.exit(1);
}
console.log(
  "verify-project-naming: ok (no forbidden superseded name strings)."
);
