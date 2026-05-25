/**
 * Single source of truth for required keys in each app env.template file.
 * Used by check-env-template-consistency.mjs and Vitest (packages/shared).
 */

export const PUBLIC_SUPABASE_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

export const SERVER_UPSTASH_KEYS = [
  "SUPABASE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "HELVETY_COOKIE_SIGNING_SECRET",
];

/** Upstash + cookie signing without `SUPABASE_SECRET_KEY` (public tools and user-scoped vault zones). */
export const UPSTASH_COOKIE_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "HELVETY_COOKIE_SIGNING_SECRET",
];

export const AUTH_EXTRA_KEYS = [
  "DEVICE_TRUST_COOKIE_SECRET",
  "HELVEETY_CHROME_EXTENSION_ORIGINS",
];

/** Gateway zone URLs required in apps/web env.template and turbo build env (Vercel). */
export const WEB_GATEWAY_KEYS = [
  "AUTH_URL",
  "STORE_URL",
  "PDF_URL",
  "DOCS_URL",
  "IMAGE_UPSCALER_URL",
  "TASKS_URL",
  "CONTACTS_URL",
  "NOTES_URL",
  "LINKS_URL",
];

/** @type {Record<string, string[]>} */
export const EXPECTED_KEYS_BY_APP = {
  auth: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS, ...AUTH_EXTRA_KEYS],
  notes: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  tasks: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  contacts: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  links: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  docs: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  store: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  pdf: [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  "image-upscaler": [...PUBLIC_SUPABASE_KEYS, ...UPSTASH_COOKIE_KEYS],
  web: [...PUBLIC_SUPABASE_KEYS, ...WEB_GATEWAY_KEYS],
};

/** Keys that must not appear in a zone’s `.env.local` / Vercel env (tier violations). */
export const FORBIDDEN_KEYS_BY_APP = {
  web: [
    "SUPABASE_SECRET_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "HELVETY_COOKIE_SIGNING_SECRET",
    "DEVICE_TRUST_COOKIE_SECRET",
  ],
  auth: [],
  store: ["DEVICE_TRUST_COOKIE_SECRET"],
  notes: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  tasks: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  contacts: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  links: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  docs: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  pdf: ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
  "image-upscaler": ["SUPABASE_SECRET_KEY", "DEVICE_TRUST_COOKIE_SECRET"],
};

/**
 * @param {string} content
 * @returns {string[]}
 */
export function parseTemplateKeys(content) {
  const keys = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const match = /^([A-Z][A-Z0-9_]*)=/.exec(trimmed);
    if (match) {
      keys.push(match[1]);
    }
  }
  return keys;
}

/**
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export async function validateEnvTemplates(rootDir) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const errors = [];

  for (const [app, expectedKeys] of Object.entries(EXPECTED_KEYS_BY_APP)) {
    const templatePath = `apps/${app}/env.template`;
    const absolutePath = resolve(rootDir, templatePath);
    const content = await readFile(absolutePath, "utf8");
    const templateKeys = parseTemplateKeys(content);
    const expectedSet = new Set(expectedKeys);
    const templateSet = new Set(templateKeys);

    const missing = expectedKeys.filter((key) => !templateSet.has(key));
    const unexpected = templateKeys.filter((key) => !expectedSet.has(key));

    if (missing.length > 0) {
      errors.push(
        `${templatePath} is missing required keys: ${missing.join(", ")}`
      );
    }
    if (unexpected.length > 0) {
      errors.push(
        `${templatePath} documents unexpected keys (remove or update env-template-expectations.mjs): ${unexpected.join(", ")}`
      );
    }

    const duplicateKeys = templateKeys.filter(
      (key, index) => templateKeys.indexOf(key) !== index
    );
    if (duplicateKeys.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateKeys)].sort();
      errors.push(
        `${templatePath} has duplicate keys: ${uniqueDuplicates.join(", ")}`
      );
    }
  }

  return errors;
}

/**
 * Ensures turbo.json exposes gateway rewrite env vars to @helvety/web builds on Vercel.
 * Without these keys in `tasks.build.env`, Turbo strips them and next.config throws.
 *
 * @param {string} rootDir
 * @returns {Promise<string[]>}
 */
export async function validateTurboGatewayBuildEnv(rootDir) {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const turboPath = resolve(rootDir, "turbo.json");
  const content = await readFile(turboPath, "utf8");
  const turbo = JSON.parse(content);
  const buildEnv = turbo?.tasks?.build?.env;

  if (!Array.isArray(buildEnv)) {
    return ["turbo.json is missing tasks.build.env array."];
  }

  const buildEnvSet = new Set(buildEnv);
  const missing = WEB_GATEWAY_KEYS.filter((key) => !buildEnvSet.has(key));
  if (missing.length === 0) {
    return [];
  }

  return [
    `turbo.json tasks.build.env must include gateway rewrite keys (add to match apps/web env.template): ${missing.join(", ")}`,
  ];
}
