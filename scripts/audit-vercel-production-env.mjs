/**
 * Audits Vercel Production env vars per Helvety zone project against tier expectations.
 * Requires: `npx vercel link` auth (logged in via CLI).
 *
 * Usage: node scripts/audit-vercel-production-env.mjs
 * Remove flagged keys: node scripts/audit-vercel-production-env.mjs --remove
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

import {
  EXPECTED_KEYS_BY_APP,
  FORBIDDEN_KEYS_BY_APP,
  WEB_GATEWAY_KEYS,
} from "./env-template-expectations.mjs";

const TEAM = "helvety";

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
  "NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS",
]);

/** Legacy Supabase key names — migrate to publishable/secret env vars. */
const LEGACY_SUPABASE_KEY_NAMES = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
]);

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
 */
async function fetchProductionEnvKeys(project) {
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
      "production",
      "--format",
      "json",
    ]);
    const parsed = JSON.parse(out);
    const envs = parsed.envs ?? [];
    return envs
      .filter((entry) => entry.target?.includes("production"))
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

async function main() {
  const remove = process.argv.includes("--remove");
  const errors = [];
  const warnings = [];
  /** @type {Array<{ project: string; app: string; key: string }>} */
  const toRemove = [];

  console.log("Helvety Vercel Production env audit\n");

  for (const [project, app] of Object.entries(PROJECT_TO_APP)) {
    const expected = new Set(EXPECTED_KEYS_BY_APP[app]);
    const forbidden = new Set(FORBIDDEN_KEYS_BY_APP[app] ?? []);
    let keys;
    try {
      keys = await fetchProductionEnvKeys(project);
    } catch (error) {
      errors.push(`${project}: failed to list env — ${error.message}`);
      continue;
    }

    const keySet = new Set(keys);
    const missing = [...expected].filter((key) => !keySet.has(key));
    const forbiddenPresent = keys.filter((key) => forbidden.has(key));
    const unexpected = keys.filter(
      (key) =>
        !expected.has(key) && !forbidden.has(key) && !OPTIONAL_KEYS.has(key)
    );

    console.log(`${project} (apps/${app}) — ${keys.length} production key(s)`);
    if (keys.length > 0) {
      console.log(`  ${keys.sort().join(", ")}`);
    }

    if (missing.length > 0) {
      errors.push(
        `${project}: missing required production keys: ${missing.join(", ")}`
      );
    }
    if (forbiddenPresent.length > 0) {
      for (const key of forbiddenPresent) {
        toRemove.push({ project, app, key });
        errors.push(`${project}: remove forbidden key for ${app} tier: ${key}`);
      }
    }
    if (unexpected.length > 0) {
      for (const key of unexpected) {
        warnings.push(
          `${project}: review extra production key (not in env.template tier): ${key}`
        );
      }
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
      "Re-run with --remove to delete forbidden production keys listed above.\n"
    );
  }

  if (errors.length > 0) {
    console.log("Issues:");
    for (const e of errors) {
      console.log(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log("Vercel Production env audit passed for all zone projects.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
