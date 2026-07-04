/**
 * Verifies that the app-level entity link type union matches the hosted
 * database constraints captured in the local Supabase export.
 *
 * The export is gitignored; skip when absent, matching the RLS export guard.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { unwrapExport } from "./check-supabase-rls-export.mjs";

function isCliMain(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return resolve(fileURLToPath(moduleUrl)) === resolve(entry);
}

const rootDir = process.cwd();
const exportPath = resolve(rootDir, "supabase/supabase.json");
const entityLinksPath = resolve(
  rootDir,
  "packages/shared/src/entity-links-client.ts"
);

/** Parses the LinkEntityType union from entity-links-client.ts. */
export function extractLinkEntityTypes(source) {
  const match = source.match(/export type LinkEntityType\s*=\s*([^;]+);/u);
  if (!match) {
    throw new Error("Could not find LinkEntityType union.");
  }
  return [...match[1].matchAll(/"([^"]+)"/gu)].map((entry) => entry[1]);
}

/** Parses allowed entity types from a Postgres CHECK clause. */
export function extractConstraintTypes(checkClause) {
  return [...checkClause.matchAll(/'([^']+)'::text/gu)].map(
    (entry) => entry[1]
  );
}

function sorted(values) {
  return [...values].sort();
}

function format(values) {
  return sorted(values).join(", ");
}

function assertSameSet({ actual, expected, label, errors }) {
  const actualSorted = sorted(actual);
  const expectedSorted = sorted(expected);
  if (actualSorted.join("\0") !== expectedSorted.join("\0")) {
    errors.push(
      `${label} mismatch: expected [${format(expected)}], got [${format(actual)}]`
    );
  }
}

/**
 * Validates entity link type parity between app code and export constraints.
 *
 * @param {{ entityLinksSource: string, exportDb: object }} input
 * @returns {string[]} Non-empty when verification fails.
 */
export function verifyEntityLinkTypes({ entityLinksSource, exportDb }) {
  const appTypes = extractLinkEntityTypes(entityLinksSource);
  const entityLinksTable = exportDb?.tables?.find(
    (table) => table.schema === "public" && table.table_name === "entity_links"
  );
  const constraints = entityLinksTable?.check_constraints ?? [];
  const sourceConstraint = constraints.find(
    (constraint) =>
      constraint.constraint_name === "entity_links_allowed_source_types"
  );
  const targetConstraint = constraints.find(
    (constraint) =>
      constraint.constraint_name === "entity_links_allowed_target_types"
  );

  const errors = [];
  if (!sourceConstraint) {
    errors.push("Missing entity_links_allowed_source_types constraint.");
  }
  if (!targetConstraint) {
    errors.push("Missing entity_links_allowed_target_types constraint.");
  }

  if (sourceConstraint) {
    assertSameSet({
      actual: extractConstraintTypes(sourceConstraint.check_clause),
      expected: appTypes,
      label: "source entity types",
      errors,
    });
  }
  if (targetConstraint) {
    assertSameSet({
      actual: extractConstraintTypes(targetConstraint.check_clause),
      expected: appTypes,
      label: "target entity types",
      errors,
    });
  }

  return errors;
}

async function main() {
  let exportRaw;
  try {
    exportRaw = await readFile(exportPath, "utf8");
  } catch {
    console.log(
      "check-entity-link-types: SKIPPED (no local supabase/supabase.json; " +
        "generate one with supabase/getSupabase.sql to verify entity link constraints)"
    );
    return;
  }

  const [entityLinksSource, parsedExport] = await Promise.all([
    readFile(entityLinksPath, "utf8"),
    Promise.resolve(unwrapExport(JSON.parse(exportRaw))),
  ]);

  const errors = verifyEntityLinkTypes({
    entityLinksSource,
    exportDb: parsedExport,
  });

  if (errors.length > 0) {
    console.error(
      "check-entity-link-types failed:\n" +
        errors.map((error) => `  - ${error}`).join("\n")
    );
    process.exit(1);
  }

  const appTypes = extractLinkEntityTypes(entityLinksSource);
  console.log(
    `check-entity-link-types: OK (${appTypes.length} entity link types)`
  );
}

if (isCliMain(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
