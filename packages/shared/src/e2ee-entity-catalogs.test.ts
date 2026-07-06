import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CONTACT_CATEGORIES,
  NOTE_CATEGORIES,
  TASK_LABELS,
  TASK_STAGES,
  catalogColor,
} from "./e2ee-entity-catalogs";

describe("e2ee-entity-catalogs", () => {
  it("contacts and notes share category catalog", () => {
    expect(CONTACT_CATEGORIES).toBe(NOTE_CATEGORIES);
  });

  it("exports CONTACT_CATEGORIES as a NOTE_CATEGORIES alias (no duplicate binding)", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "e2ee-entity-catalogs.ts"),
      "utf8"
    );
    expect(src).toContain("export { NOTE_CATEGORIES as CONTACT_CATEGORIES }");
    expect(src).not.toMatch(
      /export const CONTACT_CATEGORIES:\s*CatalogEntry\[\]\s*=\s*NOTE_CATEGORIES/
    );
  });

  it("task stages have unique ids", () => {
    const ids = TASK_STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("task labels have unique ids", () => {
    const ids = TASK_LABELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("catalogColor resolves stage color", () => {
    expect(catalogColor(TASK_STAGES, "default-item-backlog")).toBe("#64748b");
  });
});
