#!/usr/bin/env node
/**
 * Ensures the Chromium extension E2EE wiring stays aligned with @helvety/shared:
 * shared column projections, write guard, entity defaults, passkey params, KCV backfill.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensionRootCandidates = [
  join(repoRoot, "../helvety-browser-extension-chromium"),
  join(repoRoot, "../helvety-browser-extension-chromium/.helvety"),
];

const extensionRoot =
  extensionRootCandidates.find((candidate) =>
    existsSync(join(candidate, "src/lib/entity-repository.ts"))
  ) ?? null;

if (!extensionRoot) {
  console.log(
    "consistency:extension-e2ee skipped (helvety-browser-extension-chromium sibling repo not present)."
  );
  process.exit(0);
}

const failures = [];

/** @param {string} relativePath */
function readExtensionFile(relativePath) {
  const fullPath = join(extensionRoot, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing extension file: ${relativePath}`);
    return null;
  }
  return readFileSync(fullPath, "utf8");
}

/** @param {string} relativePath @param {string[]} required */
function assertPatterns(relativePath, required) {
  const src = readExtensionFile(relativePath);
  if (!src) {
    return;
  }
  for (const pattern of required) {
    if (!src.includes(pattern)) {
      failures.push(`${relativePath}: missing required pattern "${pattern}"`);
    }
  }
}

/** @param {string} relativePath @param {string[]} forbidden */
function assertNoPatterns(relativePath, forbidden) {
  const src = readExtensionFile(relativePath);
  if (!src) {
    return;
  }
  for (const pattern of forbidden) {
    if (src.includes(pattern)) {
      failures.push(`${relativePath}: forbidden pattern "${pattern}"`);
    }
  }
}

assertPatterns("src/lib/entity-repository.ts", [
  "@helvety/shared/e2ee-entity-columns",
  "ACTION_LIMITS",
  "@helvety/shared/e2ee-write-guard",
  "assertEncryptedWritePayloadAuto",
  "assertOwnedRowUpdated",
  '.select("id")',
  ".maybeSingle()",
]);

assertNoPatterns("src/lib/entity-repository.ts", [
  "./e2ee-data-select",
  "LIST_LIMIT = 500",
]);

assertPatterns("src/lib/passkey-unlock.ts", ["backfillKeyCheckValueIfMissing"]);

assertPatterns("src/lib/extension-passkey-params.ts", [
  "@helvety/shared/user-passkey-params-client",
  "fetchPasskeyParamsCore",
]);

assertPatterns("src/lib/entity-defaults.ts", [
  "@helvety/shared/e2ee-entity-defaults",
]);

assertPatterns("src/lib/extension-entity-links-hooks.tsx", [
  "getE2eeHookErrorMessage",
  "toast.error",
]);

assertNoPatterns("src/lib/extension-entity-links-hooks.tsx", ["catch {}"]);

assertPatterns("src/popup/entity-drafts.ts", [
  "@helvety/shared/e2ee-create-inputs",
  "emptyContactInput",
  "emptyTaskInput",
]);

assertPatterns("src/lib/entity-repository.ts", ["clientRecordId"]);

/** @param {string} relativePath */
function readHelvetyFile(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing helvety file: ${relativePath}`);
    return null;
  }
  return readFileSync(fullPath, "utf8");
}

/** @param {string} relativePath @param {string[]} forbidden */
function assertNoPatternsInHelvety(relativePath, forbidden) {
  const src = readHelvetyFile(relativePath);
  if (!src) {
    return;
  }
  for (const pattern of forbidden) {
    if (src.includes(pattern)) {
      failures.push(`${relativePath}: forbidden pattern "${pattern}"`);
    }
  }
}

for (const dashboard of [
  "apps/tasks/components/flat-tasks-dashboard.tsx",
  "apps/notes/components/flat-notes-dashboard.tsx",
  "apps/contacts/components/contacts-dashboard.tsx",
  "apps/links/components/links-dashboard.tsx",
]) {
  assertNoPatternsInHelvety(dashboard, [
    "seedDraft",
    "openNewDraft",
    "isPendingDraft",
    "seedLinkDraft",
    "seedFolderDraft",
  ]);
}

for (const hook of [
  "apps/tasks/hooks/use-items.ts",
  "apps/notes/hooks/use-items.ts",
  "apps/contacts/hooks/use-contacts.ts",
]) {
  const src = readHelvetyFile(hook);
  if (src) {
    if (!src.includes("create:") && !src.match(/\bcreate\b/)) {
      failures.push(`${hook}: missing save-first create export`);
    }
    if (src.includes("seedDraft")) {
      failures.push(`${hook}: forbidden pattern "seedDraft"`);
    }
  }
}

const sharedCreateInputs = readHelvetyFile(
  "packages/shared/src/e2ee-create-inputs.ts"
);
if (sharedCreateInputs) {
  for (const helper of [
    "emptyContactInput",
    "emptyTaskInput",
    "emptyNoteInput",
    "emptyLinkInput",
    "emptyLinkFolderInput",
  ]) {
    if (!sharedCreateInputs.includes(helper)) {
      failures.push(
        `packages/shared/src/e2ee-create-inputs.ts: missing ${helper}`
      );
    }
  }
  if (!sharedCreateInputs.includes("label_id: null")) {
    failures.push(
      "packages/shared/src/e2ee-create-inputs.ts: emptyTaskInput must use label_id: null (not DB sentinel)"
    );
  }
}

if (existsSync(join(extensionRoot, "src/lib/e2ee-data-select.ts"))) {
  failures.push("Remove legacy src/lib/e2ee-data-select.ts");
}

const entityDefaultsSrc = readExtensionFile("src/lib/entity-defaults.ts");
if (
  entityDefaultsSrc &&
  /DEFAULT_TASK_STAGE_ID\s*=\s*"/.test(entityDefaultsSrc)
) {
  failures.push(
    "src/lib/entity-defaults.ts must re-export shared defaults (no local string literals)"
  );
}

if (failures.length > 0) {
  console.error("consistency:extension-e2ee failed:\n");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("consistency:extension-e2ee OK");
