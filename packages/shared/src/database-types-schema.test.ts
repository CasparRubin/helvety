import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { TABLES_REQUIRING_USER_RLS } from "../../../scripts/supabase-user-tables.mjs";

const typesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "types/database.types.ts"
);

describe("database.types.ts schema guardrails", () => {
  const source = readFileSync(typesPath, "utf8");

  it("includes every user-data table from supabase-user-tables.mjs", () => {
    const missing = TABLES_REQUIRING_USER_RLS.filter(
      (table) => !new RegExp(`\\n\\s+${table}:\\s*\\{`, "u").test(source)
    );
    expect(missing, "Regenerate: bun run db:gen-types").toEqual([]);
  });

  it("user_passkey_params.Row includes key_check_value (KCV)", () => {
    const passkeyParamsBlock = source.match(
      /user_passkey_params:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\};/u
    );
    expect(passkeyParamsBlock?.[1]).toContain("key_check_value");
  });

  it("user_profiles.Row includes only deployed profile columns", () => {
    const userProfilesBlock = source.match(
      /user_profiles:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\};/u
    );
    const rowBlock = userProfilesBlock?.[1] ?? "";
    expect(rowBlock).toContain("email");
    expect(rowBlock).toContain("created_at");
    expect(rowBlock).not.toContain("display_name");
  });
});
