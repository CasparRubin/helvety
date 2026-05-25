/**
 * CI guardrail: Supabase auth must use getUser() for authorization decisions.
 * getSession() reads unverified cookie data and must not be used for authorization.
 * Enforced in CI via `bun run consistency:supabase-auth` (included in `ci:check`).
 *
 * Proxy session refresh uses getClaims() when supabase-js exposes it, else getUser().
 * Never use getSession() for authorization.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const scanRoots = [resolve(rootDir, "apps"), resolve(rootDir, "packages")];

const ALLOWLIST_SUFFIXES = [".test.ts", ".test.tsx"];

const FORBIDDEN_PATTERNS = [
  /\.auth\.getSession\s*\(/u,
  /auth\.getSession\s*\(/u,
];

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist"
      ) {
        continue;
      }
      files.push(...(await listSourceFiles(absolutePath)));
      continue;
    }
    if (
      entry.isFile() &&
      (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")) &&
      !absolutePath.endsWith(".d.ts")
    ) {
      files.push(absolutePath);
    }
  }
  return files;
}

function isAllowlisted(relativePath) {
  return ALLOWLIST_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));
}

async function main() {
  const violations = [];

  for (const scanRoot of scanRoots) {
    const files = await listSourceFiles(scanRoot);
    for (const absolutePath of files) {
      const relativePath = absolutePath
        .replace(`${rootDir}\\`, "")
        .replace(`${rootDir}/`, "");
      if (isAllowlisted(relativePath)) {
        continue;
      }
      const content = await readFile(absolutePath, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(
            `${relativePath}: uses auth.getSession() — use auth.getUser() for authorization`
          );
          break;
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Supabase auth pattern violations:\n${violations.map((v) => `  - ${v}`).join("\n")}`
    );
  }

  console.log("Supabase auth pattern checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
