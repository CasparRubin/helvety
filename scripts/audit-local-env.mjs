/**
 * Audits each app's .env.local against env.template tiers and cross-zone shared secrets.
 * Run before Vercel prod/preview updates: bun run consistency:local-env
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  AUTH_EXTRA_KEYS,
  EXPECTED_KEYS_BY_APP,
  FORBIDDEN_KEYS_BY_APP,
  PUBLIC_SUPABASE_KEYS,
  SERVER_UPSTASH_KEYS,
  UPSTASH_COOKIE_KEYS,
  WEB_GATEWAY_KEYS,
} from "./env-template-expectations.mjs";

const rootDir = process.cwd();

/** Keys that must match across all apps that define them. */
const SHARED_PARITY_KEYS = [
  ...PUBLIC_SUPABASE_KEYS,
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "HELVETY_COOKIE_SIGNING_SECRET",
];

/** User-scoped E2EE zones must share auth's device-trust signing secret. */
const DEVICE_TRUST_PARITY_APPS = new Set([
  "tasks",
  "contacts",
  "notes",
  "links",
]);

/**
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const values = {};
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
    let value = trimmed.slice(eq + 1).trim();
    const comment = value.indexOf(" #");
    if (comment !== -1) {
      value = value.slice(0, comment).trim();
    }
    if (key && value) {
      values[key] = value;
    }
  }
  return values;
}

/**
 * @param {string} app
 * @returns {Promise<{ exists: boolean; values: Record<string, string> }>}
 */
async function loadAppEnv(app) {
  const envPath = resolve(rootDir, `apps/${app}/.env.local`);
  try {
    const content = await readFile(envPath, "utf8");
    return { exists: true, values: parseEnvFile(content) };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return { exists: false, values: {} };
    }
    throw error;
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  /** @type {Record<string, Record<string, string>>} */
  const byApp = {};

  for (const app of Object.keys(EXPECTED_KEYS_BY_APP)) {
    const { exists, values } = await loadAppEnv(app);
    byApp[app] = values;
    const expected = EXPECTED_KEYS_BY_APP[app];
    const forbidden = FORBIDDEN_KEYS_BY_APP[app] ?? [];

    if (!exists) {
      warnings.push(
        `apps/${app}/.env.local: missing (copy from apps/${app}/env.template)`
      );
      continue;
    }

    const missing = expected.filter((key) => !values[key]?.trim());
    if (missing.length > 0) {
      errors.push(
        `apps/${app}/.env.local: missing required keys: ${missing.join(", ")}`
      );
    }

    const forbiddenPresent = forbidden.filter((key) => values[key]?.trim());
    if (forbiddenPresent.length > 0) {
      errors.push(
        `apps/${app}/.env.local: remove keys not used by this tier: ${forbiddenPresent.join(", ")}`
      );
    }

    const extra = Object.keys(values).filter((key) => !expected.includes(key));
    if (extra.length > 0) {
      warnings.push(
        `apps/${app}/.env.local: extra keys (review): ${extra.join(", ")}`
      );
    }
  }

  const referenceApp = byApp.auth?.NEXT_PUBLIC_SUPABASE_URL
    ? "auth"
    : Object.keys(byApp).find((a) => byApp[a].NEXT_PUBLIC_SUPABASE_URL);

  if (referenceApp) {
    const ref = byApp[referenceApp];
    for (const [app, values] of Object.entries(byApp)) {
      if (!Object.keys(values).length) {
        continue;
      }
      for (const key of SHARED_PARITY_KEYS) {
        const expected = ref[key];
        const actual = values[key];
        if (!expected || !actual) {
          continue;
        }
        if (expected !== actual) {
          errors.push(
            `Shared secret mismatch: ${key} in apps/${app}/.env.local differs from apps/${referenceApp}/.env.local`
          );
        }
      }
    }
  }

  const authDeviceTrust = byApp.auth?.DEVICE_TRUST_COOKIE_SECRET?.trim();
  if (authDeviceTrust) {
    for (const app of DEVICE_TRUST_PARITY_APPS) {
      const actual = byApp[app]?.DEVICE_TRUST_COOKIE_SECRET?.trim();
      if (!actual) {
        continue;
      }
      if (actual !== authDeviceTrust) {
        errors.push(
          `DEVICE_TRUST_COOKIE_SECRET in apps/${app}/.env.local must match apps/auth/.env.local (same value as helvety-auth on Vercel)`
        );
      }
    }
  }

  console.log("Helvety local env audit\n");
  console.log("Tier reference:");
  console.log(
    `  Gateway (web): ${PUBLIC_SUPABASE_KEYS.join(", ")}, ${WEB_GATEWAY_KEYS.join(", ")}`
  );
  console.log(`  Admin (auth, store): + ${SERVER_UPSTASH_KEYS.join(", ")}`);
  console.log(`  Auth only: + ${AUTH_EXTRA_KEYS.join(", ")}`);
  console.log(
    `  User-scoped / public tools: + ${UPSTASH_COOKIE_KEYS.join(", ")} (no SUPABASE_SECRET_KEY)\n`
  );

  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.log("Errors:");
    for (const e of errors) {
      console.log(`  - ${e}`);
    }
    console.log(
      "\nVercel checklist: copy each apps/<zone>/env.template into that Vercel project."
    );
    console.log(
      "Gateway helvety-com must include zone *_URL keys and redeploy after *_URL changes.\n"
    );
    throw new Error(`${errors.length} local env issue(s) found.`);
  }

  console.log(
    `Local .env.local audit passed for ${Object.keys(byApp).filter((a) => Object.keys(byApp[a]).length).length} app(s).`
  );
  if (warnings.length > 0) {
    console.log(
      `${warnings.length} warning(s) above (missing .env.local is OK if you do not run that zone locally).`
    );
  }
  console.log(
    "\nNext: verify the same keys in each Vercel project (Production + Preview)."
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
