/**
 * CI guardrail: public tables referenced in generated types must stay documented
 * with RLS expectations, and repo migrations must match hardened privilege model.
 * Live verification uses Supabase MCP / local supabase.json.
 *
 * @see supabase/README.md
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const typesPath = resolve(
  rootDir,
  "packages/shared/src/types/database.types.ts"
);
const migrationsDir = resolve(rootDir, "supabase/migrations");

/** Tables that must have forced RLS + user_id policies in production. */
const TABLES_REQUIRING_USER_RLS = [
  "contacts",
  "items",
  "notes",
  "links",
  "link_folders",
  "entity_links",
  "docs",
  "user_profiles",
  "user_passkey_params",
];

/** Legacy E2EE tables that must not grant table privileges to anon. */
const TABLES_REQUIRING_ANON_REVOKE = [
  "contacts",
  "items",
  "notes",
  "user_profiles",
  "user_passkey_params",
];

function assertIncludes(source, needle, label, errors) {
  if (!source.toLowerCase().includes(needle.toLowerCase())) {
    errors.push(`${label}: missing "${needle}"`);
  }
}

async function readMigration(name) {
  return readFile(resolve(migrationsDir, name), "utf8");
}

async function checkDocsCreateMigration(errors) {
  const name = "20260523120000_create_docs_table.sql";
  const sql = await readMigration(name);

  assertIncludes(
    sql,
    "alter table public.docs force row level security",
    name,
    errors
  );
  assertIncludes(
    sql,
    "grant select, insert, update, delete on public.docs to authenticated",
    name,
    errors
  );
  assertIncludes(
    sql,
    "grant select, insert, update, delete on public.docs to service_role",
    name,
    errors
  );
  assertIncludes(sql, "revoke all on public.docs from anon", name, errors);
  assertIncludes(sql, "to authenticated", name, errors);
  assertIncludes(
    sql,
    "with check ((select auth.uid()) = user_id)",
    name,
    errors
  );
}

async function checkDocsHardenMigration(errors) {
  const name = "20260524120000_harden_docs_and_revoke_anon_grants.sql";
  const sql = await readMigration(name);

  assertIncludes(
    sql,
    "grant select, insert, update, delete on public.docs to authenticated",
    name,
    errors
  );
  assertIncludes(sql, "revoke all on public.docs from anon", name, errors);
  assertIncludes(sql, "to authenticated", name, errors);

  for (const table of TABLES_REQUIRING_ANON_REVOKE) {
    assertIncludes(
      sql,
      `revoke all on public.${table} from anon`,
      name,
      errors
    );
  }
}

async function checkMigrationFilenames(errors) {
  const files = (await readdir(migrationsDir)).filter((f) =>
    f.endsWith(".sql")
  );
  const required = [
    "20260523120000_create_docs_table.sql",
    "20260524120000_harden_docs_and_revoke_anon_grants.sql",
  ];
  for (const file of required) {
    if (!files.includes(file)) {
      errors.push(`supabase/migrations: missing required file ${file}`);
    }
  }
}

async function main() {
  const source = await readFile(typesPath, "utf8");
  const errors = [];
  const missing = [];

  for (const table of TABLES_REQUIRING_USER_RLS) {
    const pattern = new RegExp(`\\n\\s+${table}:\\s*\\{`, "u");
    if (!pattern.test(source)) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    errors.push(
      "database.types.ts is missing expected public tables:\n" +
        missing.map((t) => `  - ${t}`).join("\n") +
        "\nRegenerate types after migrations: bun run db:gen-types"
    );
  }

  await checkMigrationFilenames(errors);
  await checkDocsCreateMigration(errors);
  await checkDocsHardenMigration(errors);

  if (errors.length > 0) {
    console.error(
      "check-supabase-schema-expectations failed:\n" +
        errors.map((e) => `  - ${e}`).join("\n")
    );
    process.exit(1);
  }

  console.log(
    `check-supabase-schema-expectations: OK (${TABLES_REQUIRING_USER_RLS.length} user-data tables in types; docs migrations hardened)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
