/**
 * Rewrites each apps/<zone>/.env.local using env.template comments/structure
 * while preserving existing key values. Skips apps with no .env.local.
 *
 * Usage: node scripts/sync-local-env-from-template.mjs [--dry-run]
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { EXPECTED_KEYS_BY_APP } from "./env-template-expectations.mjs";

const rootDir = process.cwd();
const dryRun = process.argv.includes("--dry-run");

/**
 * @param {string} content
 * @returns {Map<string, { value: string; comment: string }>}
 */
function parseEnvValues(content) {
  /** @type {Map<string, { value: string; comment: string }>} */
  const values = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let rest = trimmed.slice(eq + 1);
    let comment = "";
    const hashIdx = rest.indexOf(" #");
    if (hashIdx !== -1) {
      comment = rest.slice(hashIdx);
      rest = rest.slice(0, hashIdx);
    }
    const value = rest.trim();
    if (key && value) {
      values.set(key, { value, comment });
    }
  }
  return values;
}

/**
 * @param {string} templateLine
 * @param {Map<string, { value: string; comment: string }>} localValues
 */
function mergeTemplateLine(templateLine, localValues) {
  const trimmed = templateLine.trim();
  const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(trimmed);
  if (!match) {
    return templateLine;
  }

  const key = match[1];
  const local = localValues.get(key);
  if (!local) {
    return templateLine;
  }

  let templateComment = "";
  const templateRest = match[2];
  const hashIdx = templateRest.indexOf(" #");
  if (hashIdx !== -1) {
    templateComment = templateRest.slice(hashIdx);
  }

  const comment = local.comment || templateComment;
  return `${key}=${local.value}${comment}`;
}

async function syncAppEnv(app) {
  const templatePath = resolve(rootDir, `apps/${app}/env.template`);
  const localPath = resolve(rootDir, `apps/${app}/.env.local`);

  if (!existsSync(localPath)) {
    return { app, status: "skipped", reason: "no .env.local" };
  }

  const template = await readFile(templatePath, "utf8");
  const local = await readFile(localPath, "utf8");
  const localValues = parseEnvValues(local);

  const merged = template
    .split("\n")
    .map((line) => mergeTemplateLine(line, localValues))
    .join("\n");

  if (merged === local) {
    return { app, status: "unchanged" };
  }

  if (!dryRun) {
    await writeFile(localPath, merged, "utf8");
  }

  return { app, status: dryRun ? "would update" : "updated" };
}

async function main() {
  const results = [];
  for (const app of Object.keys(EXPECTED_KEYS_BY_APP)) {
    results.push(await syncAppEnv(app));
  }

  console.log(
    dryRun ? "Helvety local env sync (dry run)\n" : "Helvety local env sync\n"
  );

  for (const result of results) {
    if (result.status === "skipped") {
      console.log(`  ${result.app}: skipped (${result.reason})`);
    } else {
      console.log(`  ${result.app}: ${result.status}`);
    }
  }

  const updated = results.filter(
    (r) => r.status === "updated" || r.status === "would update"
  ).length;
  if (updated === 0) {
    console.log(
      "\nAll existing .env.local files already match env.template structure."
    );
  } else if (dryRun) {
    console.log(
      `\n${updated} file(s) would be updated. Re-run without --dry-run to apply.`
    );
  } else {
    console.log(
      `\n${updated} file(s) updated. Run: bun run consistency:local-env`
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
