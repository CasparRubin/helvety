/**
 * Monorepo guardrail (`ci:check`): public tables referenced in generated types must stay present.
 * Live schema verification uses Supabase Dashboard / MCP or a local export from
 * `supabase/getSupabase.sql` (never commit `supabase.json`).
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const typesPath = resolve(
  rootDir,
  "packages/shared/src/types/database.types.ts"
);

/** Tables that must exist in generated types (forced RLS in production). */
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
        "\nRegenerate types after schema changes: bun run db:gen-types"
    );
  }

  if (errors.length > 0) {
    console.error(
      "check-supabase-schema-expectations failed:\n" +
        errors.map((e) => `  - ${e}`).join("\n")
    );
    process.exit(1);
  }

  console.log(
    `check-supabase-schema-expectations: OK (${TABLES_REQUIRING_USER_RLS.length} user-data tables in types)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
