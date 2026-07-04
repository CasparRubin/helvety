import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  extractConstraintTypes,
  extractLinkEntityTypes,
  verifyEntityLinkTypes,
} from "../../../scripts/check-entity-link-types.mjs";
import { unwrapExport } from "../../../scripts/check-supabase-rls-export.mjs";

const testDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");

const LINK_ENTITY_TYPES_SOURCE = `export type LinkEntityType = "notes" | "items" | "contacts" | "links";`;

/** Builds a minimal entity_links table export row for constraint tests. */
function entityLinksTableExport(sourceTypes: string[], targetTypes: string[]) {
  const toCheckClause = (column: "source" | "target", types: string[]) =>
    `(${column}_entity_type = ANY (ARRAY[${types.map((type) => `'${type}'::text`).join(", ")}]))`;

  return {
    schema: "public",
    table_name: "entity_links",
    check_constraints: [
      {
        constraint_name: "entity_links_allowed_source_types",
        check_clause: toCheckClause("source", sourceTypes),
      },
      {
        constraint_name: "entity_links_allowed_target_types",
        check_clause: toCheckClause("target", targetTypes),
      },
    ],
  };
}

describe("extractLinkEntityTypes", () => {
  it("parses every member of the LinkEntityType union", () => {
    expect(extractLinkEntityTypes(LINK_ENTITY_TYPES_SOURCE)).toEqual([
      "notes",
      "items",
      "contacts",
      "links",
    ]);
  });

  it("throws when the union is missing from the source file", () => {
    expect(() => extractLinkEntityTypes("// no union here")).toThrow(
      "Could not find LinkEntityType union."
    );
  });
});

describe("extractConstraintTypes", () => {
  it("parses Postgres text literals from CHECK clauses", () => {
    expect(
      extractConstraintTypes(
        "(source_entity_type = ANY (ARRAY['notes'::text, 'links'::text]))"
      )
    ).toEqual(["notes", "links"]);
  });
});

describe("verifyEntityLinkTypes", () => {
  it("passes when app types match both source and target constraints", () => {
    const errors = verifyEntityLinkTypes({
      entityLinksSource: LINK_ENTITY_TYPES_SOURCE,
      exportDb: {
        tables: [
          entityLinksTableExport(
            ["notes", "items", "contacts", "links"],
            ["notes", "items", "contacts", "links"]
          ),
        ],
      },
    });

    expect(errors).toEqual([]);
  });

  it("flags missing constraints and type drift", () => {
    const errors = verifyEntityLinkTypes({
      entityLinksSource: LINK_ENTITY_TYPES_SOURCE,
      exportDb: {
        tables: [
          entityLinksTableExport(
            ["notes", "items", "contacts"],
            ["notes", "items", "contacts"]
          ),
        ],
      },
    });

    expect(errors.some((error) => error.includes("source entity types"))).toBe(
      true
    );
    expect(errors.some((error) => error.includes("target entity types"))).toBe(
      true
    );
  });

  it("reports missing entity_links constraints explicitly", () => {
    const errors = verifyEntityLinkTypes({
      entityLinksSource: LINK_ENTITY_TYPES_SOURCE,
      exportDb: { tables: [] },
    });

    expect(errors).toContain(
      "Missing entity_links_allowed_source_types constraint."
    );
    expect(errors).toContain(
      "Missing entity_links_allowed_target_types constraint."
    );
  });

  it("matches the local supabase.json export when present", async () => {
    let raw: string;
    let entityLinksSource: string;
    try {
      [raw, entityLinksSource] = await Promise.all([
        readFile(resolve(repoRoot, "supabase/supabase.json"), "utf8"),
        readFile(
          resolve(repoRoot, "packages/shared/src/entity-links-client.ts"),
          "utf8"
        ),
      ]);
    } catch {
      return;
    }

    const errors = verifyEntityLinkTypes({
      entityLinksSource,
      exportDb: unwrapExport(JSON.parse(raw)),
    });
    expect(errors).toEqual([]);
  });
});
