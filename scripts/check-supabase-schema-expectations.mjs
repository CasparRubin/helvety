/**
 * Monorepo guardrail (`ci:check`): public tables referenced in generated types must stay present.
 * Live schema verification uses Supabase Dashboard / MCP or a local export from
 * `supabase/getSupabase.sql` (never commit `supabase.json`).
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { TABLES_REQUIRING_USER_RLS } from "./supabase-user-tables.mjs";

const rootDir = process.cwd();
const typesPath = resolve(
  rootDir,
  "packages/shared/src/types/database.types.ts"
);

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

  const passkeyParamsBlock = source.match(
    /user_passkey_params:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\};/u
  );
  if (
    !passkeyParamsBlock ||
    !passkeyParamsBlock[1]?.includes("key_check_value")
  ) {
    errors.push(
      "database.types.ts user_passkey_params.Row must include key_check_value (KCV column). Regenerate: bun run db:gen-types"
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
