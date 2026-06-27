import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  unwrapExport,
  verifyRlsExport,
} from "../../../scripts/check-supabase-rls-export.mjs";

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

/** Builds a minimal export table row for RLS verification tests. */
function rlsTable(tableName: string) {
  return {
    schema: "public",
    table_name: tableName,
    row_level_security_enabled: true,
    row_level_security_forced: true,
    policy_count: 4,
  };
}

describe("verifyRlsExport", () => {
  it("passes when all user-data tables have forced RLS", () => {
    const { errors, warnings } = verifyRlsExport({
      export_metadata: { export_date: new Date().toISOString() },
      tables: [
        rlsTable("contacts"),
        rlsTable("items"),
        rlsTable("notes"),
        rlsTable("links"),
        rlsTable("link_folders"),
        rlsTable("entity_links"),
        rlsTable("user_profiles"),
        rlsTable("user_passkey_params"),
        rlsTable("user_auth_credentials"),
      ],
      policies: [],
    });

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("flags missing tables and unconditional permissive policies", () => {
    const { errors } = verifyRlsExport({
      tables: [rlsTable("contacts")],
      policies: [
        {
          schemaname: "public",
          tablename: "contacts",
          policyname: "open read",
          permissive: "PERMISSIVE",
          qual: "true",
        },
      ],
    });

    expect(errors.some((e) => e.includes('"items"'))).toBe(true);
    expect(errors.some((e) => e.includes("unconditional qual"))).toBe(true);
  });

  it("warns when the export is older than the stale threshold", () => {
    const staleDate = new Date("2020-01-01T00:00:00.000Z").toISOString();
    const { warnings } = verifyRlsExport(
      {
        export_metadata: { export_date: staleDate },
        tables: [
          rlsTable("contacts"),
          rlsTable("items"),
          rlsTable("notes"),
          rlsTable("links"),
          rlsTable("link_folders"),
          rlsTable("entity_links"),
          rlsTable("user_profiles"),
          rlsTable("user_passkey_params"),
          rlsTable("user_auth_credentials"),
        ],
        policies: [],
      },
      { now: Date.parse("2026-06-11T00:00:00.000Z"), staleExportDays: 90 }
    );

    expect(warnings.length).toBeGreaterThan(0);
  });

  it("matches the local supabase.json export when present", async () => {
    let raw: string;
    try {
      raw = await readFile(resolve(repoRoot, "supabase/supabase.json"), "utf8");
    } catch {
      return;
    }

    const { errors } = verifyRlsExport(unwrapExport(JSON.parse(raw)));
    expect(errors).toEqual([]);
  });
});
