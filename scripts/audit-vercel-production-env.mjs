/**
 * Audits Vercel env vars per Helvety zone project against tier expectations.
 * Requires: `npx vercel link` auth (logged in via CLI).
 *
 * Usage: node scripts/audit-vercel-production-env.mjs
 * Preview tier: node scripts/audit-vercel-production-env.mjs --preview
 * Remove flagged keys: node scripts/audit-vercel-production-env.mjs --remove
 */
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

function isCliMain(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return resolve(fileURLToPath(moduleUrl)) === resolve(entry);
}

import {
  EXPECTED_KEYS_BY_APP,
  FORBIDDEN_KEYS_BY_APP,
  productionEnvKeyIsExpectedOrAlias,
  productionEnvKeyIsPresent,
  WEB_GATEWAY_KEYS,
} from "./env-template-expectations.mjs";

const TEAM = "helvety";

/** Zones that must share the same DEVICE_TRUST_COOKIE_SECRET value in production. */
const DEVICE_TRUST_PARITY_PROJECTS = [
  "helvety-auth",
  "helvety-docs",
  "helvety-tasks",
  "helvety-contacts",
  "helvety-notes",
  "helvety-links",
];

const DEVICE_TRUST_SECRET_KEY = "DEVICE_TRUST_COOKIE_SECRET";

/** @type {Record<string, string>} */
const PROJECT_TO_APP = {
  "helvety-com": "web",
  "helvety-auth": "auth",
  "helvety-store": "store",
  "helvety-docs": "docs",
  "helvety-pdf": "pdf",
  "helvety-image-upscaler": "image-upscaler",
  "helvety-tasks": "tasks",
  "helvety-contacts": "contacts",
  "helvety-notes": "notes",
  "helvety-links": "links",
};

const OPTIONAL_KEYS = new Set([
  "SKIP_ENV_VALIDATION",
  "HELVETY_SERVER_ACTION_ALLOWED_ORIGINS",
]);

/** Legacy Supabase key names — migrate to publishable/secret env vars. */
const LEGACY_SUPABASE_KEY_NAMES = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
]);

/**
 * Validates one zone project's env keys against tier expectations.
 *
 * @param {{
 *   project: string;
 *   app: string;
 *   keys: string[];
 *   target?: "production" | "preview";
 * }} input
 * @returns {{ errors: string[]; warnings: string[]; toRemove: Array<{ project: string; app: string; key: string }> }}
 */
export function auditProjectEnv({ project, app, keys, target = "production" }) {
  const expected = new Set(EXPECTED_KEYS_BY_APP[app]);
  const forbidden = new Set(FORBIDDEN_KEYS_BY_APP[app] ?? []);
  const errors = [];
  const warnings = [];
  /** @type {Array<{ project: string; app: string; key: string }>} */
  const toRemove = [];

  const keySet = new Set(keys);
  const missing = [...expected].filter(
    (key) => !productionEnvKeyIsPresent(key, keySet)
  );
  const forbiddenPresent = keys.filter((key) => forbidden.has(key));
  const unexpected = keys.filter(
    (key) =>
      !productionEnvKeyIsExpectedOrAlias(key, expected) &&
      !forbidden.has(key) &&
      !OPTIONAL_KEYS.has(key)
  );

  if (missing.length > 0) {
    errors.push(
      `${project}: missing required ${target} keys: ${missing.join(", ")}`
    );
  }
  for (const key of forbiddenPresent) {
    toRemove.push({ project, app, key });
    errors.push(`${project}: remove forbidden key for ${app} tier: ${key}`);
  }
  for (const key of unexpected) {
    warnings.push(
      `${project}: review extra ${target} key (not in env.template tier): ${key}`
    );
  }
  for (const key of keys) {
    if (LEGACY_SUPABASE_KEY_NAMES.has(key)) {
      warnings.push(
        `${project}: legacy Supabase key name ${key} — use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY`
      );
    }
  }
  if (app === "web") {
    const missingGateway = WEB_GATEWAY_KEYS.filter((key) => !keySet.has(key));
    if (missingGateway.length > 0) {
      errors.push(
        `${project}: missing gateway rewrite URLs: ${missingGateway.join(", ")}`
      );
    }
  }

  return { errors, warnings, toRemove };
}

/**
 * SHA-256 hash of a secret for cross-project parity checks (never log raw values).
 *
 * @param {string} value
 */
export function hashDeviceTrustSecret(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Max allowed spread of `updatedAt` (ms) across zones when values are sensitive (not readable). */
export const DEVICE_TRUST_SENSITIVE_UPDATED_AT_MAX_SPREAD_MS = 60 * 60 * 1000;

/**
 * @param {Record<string, { hash: string | null; updatedAt: number; type: string } | null>} projectRecords
 * @returns {{ errors: string[]; warnings: string[] }}
 */
export function auditDeviceTrustSecretParity(projectRecords) {
  const errors = [];
  const warnings = [];
  const entries = Object.entries(projectRecords);
  const missing = entries
    .filter(([, record]) => record == null)
    .map(([project]) => project);
  if (missing.length > 0) {
    errors.push(`${DEVICE_TRUST_SECRET_KEY} missing on: ${missing.join(", ")}`);
  }

  const present = entries
    .map(([, record]) => record)
    .filter((record) => record != null);
  if (present.length === 0) {
    return { errors, warnings };
  }

  const hashes = present
    .map((record) => record.hash)
    .filter((hash) => hash != null);
  const uniqueHashes = new Set(hashes);
  if (hashes.length > 0 && uniqueHashes.size > 1) {
    const summary = entries
      .filter(([, record]) => record?.hash)
      .map(([project, record]) => `${project}=${record.hash.slice(0, 12)}…`)
      .join(", ");
    errors.push(
      `${DEVICE_TRUST_SECRET_KEY} hash mismatch across zones (${summary})`
    );
  }

  const allSensitive = present.every((record) => record.type === "sensitive");
  const noneReadable = hashes.length === 0;
  if (allSensitive && noneReadable) {
    const updatedAts = present.map((record) => record.updatedAt);
    const spreadMs = Math.max(...updatedAts) - Math.min(...updatedAts);
    if (spreadMs > DEVICE_TRUST_SENSITIVE_UPDATED_AT_MAX_SPREAD_MS) {
      errors.push(
        `${DEVICE_TRUST_SECRET_KEY} updated independently across zones (spread ${Math.round(spreadMs / 1000)}s) — verify the same value in Vercel dashboard`
      );
    } else {
      warnings.push(
        `${DEVICE_TRUST_SECRET_KEY} is sensitive in Vercel (values not readable via CLI); updatedAt spread ${Math.round(spreadMs / 1000)}s across zones looks consistent`
      );
    }
  } else if (hashes.length > 0 && hashes.length < present.length) {
    warnings.push(
      `${DEVICE_TRUST_SECRET_KEY} is readable on some zones only — confirm all zones share the same value in Vercel`
    );
  }

  return { errors, warnings };
}

/**
 * @param {string} cwd
 * @param {string[]} args
 */
function runVercel(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["vercel@latest", ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(stderr.trim() || stdout.trim() || `vercel exit ${code}`)
        );
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * @param {string} project
 * @param {"production" | "preview"} target
 */
async function fetchEnvKeys(project, target) {
  const base = await mkdtemp(join(tmpdir(), "helvety-vercel-env-"));
  const cwd = join(base, project);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(cwd, { recursive: true });
  try {
    await runVercel(cwd, [
      "link",
      "--yes",
      "--project",
      project,
      "--scope",
      TEAM,
    ]);
    const out = await runVercel(cwd, [
      "env",
      "list",
      target,
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(out);
    const envs = parsed.envs ?? [];
    return envs
      .filter((entry) => entry.target?.includes(target))
      .map((entry) => entry.key);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

/**
 * @param {string} project
 * @param {string} key
 */
async function removeProductionEnv(project, key) {
  const base = await mkdtemp(join(tmpdir(), "helvety-vercel-env-"));
  const cwd = join(base, project);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(cwd, { recursive: true });
  try {
    await runVercel(cwd, [
      "link",
      "--yes",
      "--project",
      project,
      "--scope",
      TEAM,
    ]);
    await runVercel(cwd, ["env", "remove", key, "production", "--yes"]);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

/**
 * Fetches DEVICE_TRUST env metadata via authenticated Vercel API (CLI).
 *
 * @param {string} project
 * @param {"production" | "preview"} target
 * @returns {Promise<{ hash: string | null; updatedAt: number; type: string } | null>}
 */
async function fetchDeviceTrustEnvRecord(project, target) {
  const base = await mkdtemp(join(tmpdir(), "helvety-vercel-env-"));
  const cwd = join(base, project);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(cwd, { recursive: true });
  try {
    await runVercel(cwd, [
      "link",
      "--yes",
      "--project",
      project,
      "--scope",
      TEAM,
    ]);
    const out = await runVercel(cwd, [
      "api",
      `/v10/projects/${project}/env?decrypt=true&target=${target}`,
    ]);
    const parsed = JSON.parse(out);
    const entry = (parsed.envs ?? []).find(
      (env) => env.key === DEVICE_TRUST_SECRET_KEY
    );
    if (!entry) {
      return null;
    }
    const value = typeof entry.value === "string" ? entry.value.trim() : "";
    return {
      type: entry.type ?? "unknown",
      updatedAt: entry.updatedAt ?? 0,
      hash: value.length > 0 ? hashDeviceTrustSecret(value) : null,
    };
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

async function main() {
  const remove = process.argv.includes("--remove");
  const preview = process.argv.includes("--preview");
  const target = preview ? "preview" : "production";
  const errors = [];
  const warnings = [];
  /** @type {Array<{ project: string; app: string; key: string }>} */
  const toRemove = [];

  console.log(`Helvety Vercel ${target} env audit\n`);

  for (const [project, app] of Object.entries(PROJECT_TO_APP)) {
    let keys;
    try {
      keys = await fetchEnvKeys(project, target);
    } catch (error) {
      errors.push(`${project}: failed to list env — ${error.message}`);
      continue;
    }

    console.log(`${project} (apps/${app}) — ${keys.length} ${target} key(s)`);
    if (keys.length > 0) {
      console.log(`  ${keys.sort().join(", ")}`);
    }

    const result = auditProjectEnv({ project, app, keys, target });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    toRemove.push(...result.toRemove);
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("Warnings (review — may be intentional shared vars):");
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
    console.log("");
  }

  if (toRemove.length > 0 && remove) {
    console.log("Removing forbidden production env vars…");
    for (const { project, key } of toRemove) {
      try {
        await removeProductionEnv(project, key);
        console.log(`  removed ${project} / ${key}`);
      } catch (error) {
        errors.push(`${project}: failed to remove ${key} — ${error.message}`);
      }
    }
    console.log("");
  } else if (toRemove.length > 0) {
    console.log(
      `Re-run with --remove to delete forbidden ${target} keys listed above.\n`
    );
  }

  console.log(`${DEVICE_TRUST_SECRET_KEY} parity (${target})…`);
  /** @type {Record<string, { hash: string | null; updatedAt: number; type: string } | null>} */
  const deviceTrustRecords = {};
  for (const project of DEVICE_TRUST_PARITY_PROJECTS) {
    try {
      deviceTrustRecords[project] = await fetchDeviceTrustEnvRecord(
        project,
        target
      );
      const record = deviceTrustRecords[project];
      if (!record) {
        console.log(`  ${project}: missing`);
        continue;
      }
      const hashLabel = record.hash
        ? `${record.hash.slice(0, 12)}…`
        : `sensitive (${record.type})`;
      console.log(`  ${project}: ${hashLabel}, updated ${record.updatedAt}`);
    } catch (error) {
      errors.push(
        `${project}: failed to inspect ${DEVICE_TRUST_SECRET_KEY} — ${error.message}`
      );
      deviceTrustRecords[project] = null;
    }
  }
  const parity = auditDeviceTrustSecretParity(deviceTrustRecords);
  errors.push(...parity.errors);
  warnings.push(...parity.warnings);
  console.log("");

  if (errors.length > 0) {
    console.log("Issues:");
    for (const e of errors) {
      console.log(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log(`Vercel ${target} env audit passed for all zone projects.`);
}

if (isCliMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
