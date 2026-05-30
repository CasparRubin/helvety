/**
 * CI guardrail: Supabase auth must use getUser() for authorization decisions.
 * getSession() reads unverified cookie data and must not be used for authorization.
 * Session cookie mutations must use createServerMutatingClient (not createServerClient).
 * Enforced in CI via `bun run consistency:supabase-auth` (included in `ci:check`).
 *
 * Proxy session refresh uses getClaims() at the edge; authorization uses getUser().
 * Never use getSession() for authorization.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const scanRoots = [resolve(rootDir, "apps"), resolve(rootDir, "packages")];

const ALLOWLIST_SUFFIXES = [".test.ts", ".test.tsx"];

const FORBIDDEN_GET_SESSION_PATTERNS = [
  /\.auth\.getSession\s*\(/u,
  /auth\.getSession\s*\(/u,
];

const SESSION_MUTATION_PATTERNS = [
  /\.auth\.verifyOtp\s*\(/u,
  /\.auth\.exchangeCodeForSession\s*\(/u,
  /\.auth\.updateUser\s*\(/u,
];

/** Client-only signOut calls use `scope: "local"` and do not persist server cookies. */
const SERVER_SIGN_OUT_PATTERN = /\.auth\.signOut\s*\(/u;
const CLIENT_LOCAL_SIGN_OUT_PATTERN =
  /\.auth\.signOut\s*\(\s*\{\s*scope:\s*["']local["']/u;

const MUTATING_CLIENT_IMPORT = /createServerMutatingClient/u;

const READ_ONLY_CLIENT_ASSIGNMENT =
  /(?:const|let)\s+\w+\s*=\s*await\s+createServerClient\s*\(/u;

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

function fileUsesServerSessionMutations(content) {
  const hasMutation = SESSION_MUTATION_PATTERNS.some((pattern) =>
    pattern.test(content)
  );
  if (hasMutation) {
    return true;
  }
  if (!SERVER_SIGN_OUT_PATTERN.test(content)) {
    return false;
  }
  return !CLIENT_LOCAL_SIGN_OUT_PATTERN.test(content);
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

      for (const pattern of FORBIDDEN_GET_SESSION_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(
            `${relativePath}: uses auth.getSession() — use auth.getUser() for authorization`
          );
          break;
        }
      }

      if (!fileUsesServerSessionMutations(content)) {
        continue;
      }

      if (!MUTATING_CLIENT_IMPORT.test(content)) {
        violations.push(
          `${relativePath}: performs server auth session mutation but does not import createServerMutatingClient`
        );
        continue;
      }

      if (READ_ONLY_CLIENT_ASSIGNMENT.test(content)) {
        violations.push(
          `${relativePath}: assigns createServerClient() in a file that mutates auth sessions — use createServerMutatingClient for verifyOtp/exchangeCodeForSession/signOut/updateUser`
        );
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
