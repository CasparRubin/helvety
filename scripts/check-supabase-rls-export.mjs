/**
 * Verifies RLS posture in the local Supabase export (`supabase/supabase.json`,
 * gitignored, generated via `supabase/getSupabase.sql`).
 *
 * For every user-data table it requires: presence in the export, RLS enabled
 * and forced, and no permissive policy with an unconditional (`true`) qual.
 * A missing table means the export is stale or the schema lacks the table —
 * both must be resolved before relying on RLS for that table.
 *
 * Skips (exit 0) when the export is absent, since it must never be committed.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { TABLES_REQUIRING_USER_RLS } from "./supabase-user-tables.mjs";

const rootDir = process.cwd();
const exportPath = resolve(rootDir, "supabase/supabase.json");

/** Maximum export age before we warn that conclusions may be stale. */
const STALE_EXPORT_DAYS = 90;

/** Extracts the export payload regardless of the row-wrapper shape. */
export function unwrapExport(parsed) {
  const root = parsed?.["0"] ?? parsed;
  return root?.complete_database_export ?? root;
}

/**
 * Validates RLS posture for user-data tables in a parsed export payload.
 *
 * @param {object} db Unwrapped export from {@link unwrapExport}.
 * @param {{ now?: number, staleExportDays?: number }} [options]
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function verifyRlsExport(db, options = {}) {
  const now = options.now ?? Date.now();
  const staleExportDays = options.staleExportDays ?? STALE_EXPORT_DAYS;
  const errors = [];
  const warnings = [];

  const exportDate = db?.export_metadata?.export_date;
  if (exportDate) {
    const ageDays = (now - Date.parse(exportDate)) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays > staleExportDays) {
      warnings.push(
        `export is ${Math.round(ageDays)} days old (${exportDate}); regenerate via getSupabase.sql`
      );
    }
  }

  const publicTables = (db?.tables ?? []).filter((t) => t.schema === "public");
  const tablesByName = new Map(publicTables.map((t) => [t.table_name, t]));
  const policies = (db?.policies ?? []).filter(
    (p) => (p.schemaname ?? p.schema) === "public"
  );

  for (const tableName of TABLES_REQUIRING_USER_RLS) {
    const table = tablesByName.get(tableName);
    if (!table) {
      errors.push(
        `table "${tableName}" is in generated types but missing from the export — ` +
          "the export is stale or the table is not deployed; regenerate the export " +
          "and confirm the table exists with forced RLS before shipping its zone"
      );
      continue;
    }

    if (table.row_level_security_enabled === false) {
      errors.push(`table "${tableName}" does not have RLS enabled`);
    }
    if (table.row_level_security_forced === false) {
      errors.push(`table "${tableName}" does not have RLS forced`);
    }

    const tablePolicies = policies.filter(
      (p) => (p.tablename ?? p.table_name) === tableName
    );
    if (tablePolicies.length === 0 && table.policy_count !== undefined) {
      if (!table.policy_count) {
        errors.push(`table "${tableName}" has RLS but zero policies`);
      }
    }

    for (const policy of tablePolicies) {
      const qual = (policy.qual ?? "").trim().toLowerCase();
      if (policy.permissive === "PERMISSIVE" && qual === "true") {
        errors.push(
          `table "${tableName}" has permissive policy "${policy.policyname}" with unconditional qual (true)`
        );
      }
    }
  }

  return { errors, warnings };
}

async function main() {
  let raw;
  try {
    raw = await readFile(exportPath, "utf8");
  } catch {
    console.log(
      "check-supabase-rls-export: SKIPPED (no local supabase/supabase.json; " +
        "generate one with supabase/getSupabase.sql to verify RLS)"
    );
    return;
  }

  const { errors, warnings } = verifyRlsExport(unwrapExport(JSON.parse(raw)));

  for (const warning of warnings) {
    console.warn(`check-supabase-rls-export: WARNING — ${warning}`);
  }

  if (errors.length > 0) {
    console.error(
      "check-supabase-rls-export failed:\n" +
        errors.map((e) => `  - ${e}`).join("\n")
    );
    process.exit(1);
  }

  console.log(
    `check-supabase-rls-export: OK (${TABLES_REQUIRING_USER_RLS.length} user-data tables verified against local export)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
