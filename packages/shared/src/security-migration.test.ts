import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "../../supabase/migrations");

/**
 * Returns the latest security hardening migration file path if it exists.
 */
function resolveSecurityHardeningMigrationPath(): string | null {
  if (!existsSync(migrationsDir)) {
    return null;
  }

  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => /^\d+_security_hardening_privileges\.sql$/.test(file))
    .sort();

  const latestMigration = migrationFiles.at(-1);

  if (!latestMigration) {
    return null;
  }

  return resolve(migrationsDir, latestMigration);
}

const securityMigrationPath = resolveSecurityHardeningMigrationPath();

describe("security hardening migration", () => {
  it("accepts repos without local migration snapshots", () => {
    if (!securityMigrationPath) {
      expect(securityMigrationPath).toBeNull();
      return;
    }

    const sql = readFileSync(securityMigrationPath, "utf8");

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
