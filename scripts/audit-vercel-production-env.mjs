/**
 * Audits Vercel env vars per Helvety zone project against tier expectations.
 * Requires: `npx vercel link` auth (logged in via CLI).
 *
 * Usage: node scripts/audit-vercel-production-env.mjs
 * Preview tier: node scripts/audit-vercel-production-env.mjs --preview
 * Remove flagged keys: node scripts/audit-vercel-production-env.mjs --remove
 */
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

/** @type {Record<string, string>} */
export const PROJECT_TO_APP = {
  "helvety-com": "web",
  "helvety-store": "store",
  "helvety-pdf": "pdf",
  "helvety-image-editor": "image-editor",
  "helvety-ocr": "ocr",
};

const OPTIONAL_KEYS = new Set([
  "SKIP_ENV_VALIDATION",
  "HELVETY_SERVER_ACTION_ALLOWED_ORIGINS",
]);

/** Retired auth/DB env names that must be removed from every zone project. */
const RETIRED_SUPABASE_ENV_KEY_NAMES = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
  "HELVETY_COOKIE_SIGNING_SECRET",
  "DEVICE_TRUST_COOKIE_SECRET",
]);

/** Retired env vars that must not remain on any zone project (removed apps / rewrites). */
export const OBSOLETE_VERCEL_ENV_KEYS = [
  "DOCS_URL",
  "AUTH_URL",
  "TASKS_URL",
  "CONTACTS_URL",
  "NOTES_URL",
  "LINKS_URL",
  "IMAGE_UPSCALER_URL",
];

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
  for (const key of keys) {
    if (OBSOLETE_VERCEL_ENV_KEYS.includes(key)) {
      toRemove.push({ project, app, key });
      errors.push(
        `${project}: remove obsolete env var (retired zone or rewrite): ${key}`
      );
    }
  }
  for (const key of unexpected) {
    warnings.push(
      `${project}: review extra ${target} key (not in env.template tier): ${key}`
    );
  }
  for (const key of keys) {
    if (RETIRED_SUPABASE_ENV_KEY_NAMES.has(key)) {
      toRemove.push({ project, app, key });
      errors.push(
        `${project}: remove retired auth/DB env var ${key} (helvety.com no longer uses Supabase)`
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
 * @param {"production" | "preview"} target
 */
async function removeEnvVar(project, key, target) {
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
    await runVercel(cwd, ["env", "remove", key, target, "--yes"]);
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
      errors.push(`${project}: failed to list env: ${error.message}`);
      continue;
    }

    console.log(`${project} (apps/${app}): ${keys.length} ${target} key(s)`);
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
    console.log("Warnings (review; may be intentional shared vars):");
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
    console.log("");
  }

  if (toRemove.length > 0 && remove) {
    console.log(`Removing forbidden/obsolete ${target} env vars…`);
    for (const { project, key } of toRemove) {
      try {
        await removeEnvVar(project, key, target);
        console.log(`  removed ${project} / ${key} (${target})`);
      } catch (error) {
        errors.push(`${project}: failed to remove ${key}: ${error.message}`);
      }
    }
    console.log("");
  } else if (toRemove.length > 0) {
    console.log(
      `Re-run with --remove to delete forbidden/obsolete ${target} keys listed above.\n`
    );
  }

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
