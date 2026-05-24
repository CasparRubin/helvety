/**
 * CI guardrail: public tables referenced in generated types must stay documented
 * with RLS expectations. Live verification uses Supabase MCP / local supabase.json.
 *
 * @see supabase/README.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const typesPath = resolve(
  rootDir,
  "packages/shared/src/types/database.types.ts"
);

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

async function main() {
  const source = await readFile(typesPath, "utf8");
  const missing = [];

  for (const table of TABLES_REQUIRING_USER_RLS) {
    const pattern = new RegExp(`\\n\\s+${table}:\\s*\\{`, "u");
    if (!pattern.test(source)) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    console.error(
      "check-supabase-schema-expectations: database.types.ts is missing expected public tables:\n" +
        missing.map((t) => `  - ${t}`).join("\n") +
        "\nRegenerate types after migrations: bun run db:gen-types"
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
