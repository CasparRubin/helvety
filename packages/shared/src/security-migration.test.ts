import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "../../supabase/migrations/20260314_security_hardening_privileges.sql"
);

describe("security hardening migration", () => {
  it("includes revoke/definer hardening statements for high-risk DB paths", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "REVOKE EXECUTE ON FUNCTION storage.delete_leaf_prefixes(text[], text[]) FROM PUBLIC;"
    );
    expect(sql).toContain(
      "ALTER FUNCTION storage.delete_leaf_prefixes(text[], text[])"
    );
    expect(sql).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE vault.secrets FROM service_role;"
    );
    expect(sql).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE vault.decrypted_secrets FROM service_role;"
    );
  });
});
