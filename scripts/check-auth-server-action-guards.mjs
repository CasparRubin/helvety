/**
 * Monorepo guardrail (`ci:check`): auth zone server actions must use the
 * documented guard helpers — `authenticateAndRateLimit` for session reads,
 * `runAuthActionGuards` / `runRateLimitGuard` for pre-auth flows.
 * Login bootstrap reads (`device-trust-actions.ts`) are allowlisted separately.
 *
 * Enforced via `bun run consistency:auth-action-guards`.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const rootDir = process.cwd();
const actionsDir = resolve(rootDir, "apps/auth/app/actions");

/** Helper modules — not exported `"use server"` action surfaces. */
const NON_ACTION_FILES = new Set([
  "auth-action-helpers.ts",
  "auth-rp-config.ts",
  "device-trust-cookie.ts",
  "user-lookup.ts",
]);

/** Login bootstrap reads — unauthenticated cookie probe (no session / rate-limit guard). */
const LOGIN_BOOTSTRAP_ACTION_FILES = new Set(["device-trust-actions.ts"]);

/** Pre-auth ceremony actions (OTP / passkey sign-in before session exists). */
const PRE_AUTH_ACTION_FILES = new Set([
  "otp-actions.ts",
  "passkey-auth-actions.ts",
]);

/** Authenticated server-action modules (session required via authenticateAndRateLimit). */
const AUTHENTICATED_ACTION_FILES = new Set([
  "credential-actions.ts",
  "encryption-actions.ts",
  "passkey-registration-actions.ts",
]);

const MANUAL_SESSION_AUTH_PATTERNS = [
  /\bgetAuthUser\s*\(/u,
  /(?:const|let)\s+\w+\s*=\s*await\s+createServerClient\s*\(/u,
];

const AUTHENTICATED_GUARD_PATTERN = /\bauthenticateAndRateLimit\s*\(/u;
const PRE_AUTH_GUARD_PATTERNS = [
  /\brunAuthActionGuards\s*\(/u,
  /\brunRateLimitGuard\s*\(/u,
];

/**
 * @param {string} relativePath
 * @param {string} content
 * @returns {string[]}
 */
export function verifyAuthActionGuards(relativePath, content) {
  const fileName = basename(relativePath);
  if (fileName.endsWith(".test.ts") || NON_ACTION_FILES.has(fileName)) {
    return [];
  }
  if (!content.includes('"use server"') && !content.includes("'use server'")) {
    return [];
  }

  const violations = [];
  const usesManualSessionAuth = MANUAL_SESSION_AUTH_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

  if (usesManualSessionAuth && !AUTHENTICATED_GUARD_PATTERN.test(content)) {
    violations.push(
      `${relativePath}: uses manual session auth (getAuthUser/createServerClient) without authenticateAndRateLimit`
    );
  }

  if (LOGIN_BOOTSTRAP_ACTION_FILES.has(fileName)) {
    return violations;
  }

  if (PRE_AUTH_ACTION_FILES.has(fileName)) {
    if (!PRE_AUTH_GUARD_PATTERNS.some((pattern) => pattern.test(content))) {
      violations.push(
        `${relativePath}: pre-auth server actions must use runAuthActionGuards or runRateLimitGuard`
      );
    }
    return violations;
  }

  if (
    AUTHENTICATED_ACTION_FILES.has(fileName) &&
    !AUTHENTICATED_GUARD_PATTERN.test(content)
  ) {
    violations.push(
      `${relativePath}: authenticated server actions must use authenticateAndRateLimit`
    );
  }

  return violations;
}

async function listActionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      continue;
    }
    files.push(resolve(directory, entry.name));
  }
  return files;
}

async function main() {
  const violations = [];
  const files = await listActionFiles(actionsDir);

  for (const absolutePath of files) {
    const relativePath = absolutePath
      .replace(`${rootDir}\\`, "")
      .replace(`${rootDir}/`, "");
    const content = await readFile(absolutePath, "utf8");
    violations.push(...verifyAuthActionGuards(relativePath, content));
  }

  if (violations.length > 0) {
    throw new Error(
      `Auth server-action guard violations:\n${violations.map((v) => `  - ${v}`).join("\n")}`
    );
  }

  console.log("Auth server-action guard checks passed.");
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
