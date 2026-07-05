/**
 * Monorepo guardrail (`ci:check`): E2EE entity modules must use field-bound
 * encryptEntityField / decryptEntityField.
 *
 * Enforced via `bun run ci:check` (`consistency:e2ee-aad`).
 */
import { readFile } from "node:fs/promises";
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

/** Raw low-level encrypt/decrypt must not appear in entity modules. */
const FORBIDDEN_PATTERNS = [
  /\bawait\s+encrypt\s*\(/u,
  /\bawait\s+decrypt\s*\(/u,
];

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
      !content.includes("encryptEntityField") ||
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

async function main() {
  const violations = [
    ...(await scanEntityCryptoModules()),
    ...(await scanContactLinkHooks()),
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
