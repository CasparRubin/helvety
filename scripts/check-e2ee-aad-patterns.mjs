/**
 * Monorepo guardrail (`ci:check`): E2EE entity modules must use field-bound
 * encryptEntityField / decryptEntityField (v2 AAD) instead of raw encrypt/decrypt
 * with shared record-level AAD.
 *
 * Enforced via `bun run ci:check` (`consistency:e2ee-aad`).
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();

/** Client-side entity encryption modules that must use field-bound helpers. */
const ENTITY_CRYPTO_PATHS = [
  "apps/contacts/lib/crypto/contact-encryption.ts",
  "apps/tasks/lib/crypto/task-encryption.ts",
  "apps/notes/lib/crypto/note-encryption.ts",
  "apps/links/lib/crypto/link-encryption.ts",
  "apps/links/lib/crypto/link-folder-encryption.ts",
];

const ALLOWLIST_SUFFIXES = [".test.ts", ".test.tsx"];

/** Raw encrypt/decrypt with buildAAD in entity modules (legacy v1 pattern). */
const FORBIDDEN_PATTERNS = [
  /\bawait\s+encrypt\s*\(/u,
  /\bawait\s+decrypt\s*\(/u,
  /\bencryptFields\s*\(/u,
  /\bdecryptFields\s*\(/u,
  /\bbuildAAD\s*\(/u,
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

function relativeFromRoot(absolutePath) {
  return absolutePath.startsWith(`${rootDir}/`)
    ? absolutePath.slice(rootDir.length + 1)
    : absolutePath;
}

async function scanEntityCryptoModules() {
  const violations = [];

  for (const relativePath of ENTITY_CRYPTO_PATHS) {
    const absolutePath = resolve(rootDir, relativePath);
    let content;
    try {
      content = await readFile(absolutePath, "utf8");
    } catch {
      violations.push(`${relativePath}: file not found`);
      continue;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `${relativePath}: must use encryptEntityField/decryptEntityField (found ${pattern})`
        );
        break;
      }
    }

    if (
      !content.includes("encryptEntityField") &&
      !content.includes("decryptEntityField")
    ) {
      violations.push(
        `${relativePath}: missing encryptEntityField or decryptEntityField usage`
      );
    }
  }

  return violations;
}

/** Hooks that decrypt contact picker rows must use decryptEntityField. */
async function scanContactLinkHooks() {
  const hookPaths = [
    "apps/tasks/hooks/use-contact-links.ts",
    "apps/links/hooks/use-contact-links.ts",
  ];
  const violations = [];

  for (const relativePath of hookPaths) {
    const absolutePath = resolve(rootDir, relativePath);
    const content = await readFile(absolutePath, "utf8");
    if (/\bawait\s+decrypt\s*\(/u.test(content)) {
      violations.push(
        `${relativePath}: contact link hooks must use decryptEntityField`
      );
    }
    if (!content.includes("decryptEntityField")) {
      violations.push(
        `${relativePath}: missing decryptEntityField for contact fields`
      );
    }
  }

  return violations;
}

/** packages/shared/src/crypto/encryption.ts is allowed to define low-level encrypt/decrypt. */
async function scanAccidentalRawEncryptOutsideCore() {
  const scanRoots = [
    resolve(rootDir, "apps"),
    resolve(rootDir, "packages/shared/src/crypto"),
  ];
  const violations = [];
  const files = [];
  for (const root of scanRoots) {
    files.push(...(await listSourceFiles(root)));
  }

  for (const absolutePath of files) {
    const relativePath = relativeFromRoot(absolutePath);
    if (isAllowlisted(relativePath)) continue;
    if (relativePath === "packages/shared/src/crypto/encryption.ts") continue;
    if (
      relativePath.endsWith("/encryption.ts") &&
      relativePath.includes("/lib/crypto/")
    ) {
      continue;
    }
    if (
      !relativePath.includes("-encryption.ts") &&
      !relativePath.includes("encrypt-entities")
    ) {
      continue;
    }

    const content = await readFile(absolutePath, "utf8");
    if (
      /\bawait\s+encrypt\s*\(/u.test(content) &&
      content.includes("buildAAD")
    ) {
      violations.push(
        `${relativePath}: use encryptEntityField instead of encrypt + buildAAD`
      );
    }
  }

  return violations;
}

async function main() {
  const violations = [
    ...(await scanEntityCryptoModules()),
    ...(await scanContactLinkHooks()),
    ...(await scanAccidentalRawEncryptOutsideCore()),
  ];

  if (violations.length > 0) {
    console.error("E2EE AAD guardrail failed:\n");
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log(
    `E2EE AAD guardrail passed (${ENTITY_CRYPTO_PATHS.length} entity modules).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
