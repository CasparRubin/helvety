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

export const COOKIE_SIGNING_KEYS = ["HELVETY_COOKIE_SIGNING_SECRET"];

export const AUTH_EXTRA_KEYS = ["DEVICE_TRUST_COOKIE_SECRET"];

export const WEB_GATEWAY_KEYS = [
  "AUTH_URL",
  "STORE_URL",
  "PDF_URL",
  "IMAGE_UPSCALER_URL",
  "TASKS_URL",
  "CONTACTS_URL",
  "NOTES_URL",
  "LINKS_URL",
  "DOCS_URL",
];

/** @type {Record<string, string[]>} */
export const EXPECTED_KEYS_BY_APP = {
  auth: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS, ...AUTH_EXTRA_KEYS],
  notes: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  tasks: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  contacts: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  links: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  docs: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  store: [...PUBLIC_SUPABASE_KEYS, ...SERVER_UPSTASH_KEYS],
  pdf: [...PUBLIC_SUPABASE_KEYS, ...COOKIE_SIGNING_KEYS],
  "image-upscaler": [...PUBLIC_SUPABASE_KEYS, ...COOKIE_SIGNING_KEYS],
  web: [...PUBLIC_SUPABASE_KEYS, ...WEB_GATEWAY_KEYS],
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
