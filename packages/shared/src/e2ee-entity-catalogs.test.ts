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
