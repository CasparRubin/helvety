import { describe, expect, it } from "vitest";

import {
  CONTACT_LINK_PICKER_COLUMNS,
  E2EE_DETAIL_COLUMNS,
  E2EE_LIST_COLUMNS,
  E2EE_PREFETCH_COLUMNS,
} from "./e2ee-entity-columns";
import { PLAINTEXT_CONTENT_FIELD_NAMES } from "./e2ee-write-guard";

/**
 *
 */
function columnTokens(select: string): string[] {
  return select.split(",").map((column) => column.trim());
}

describe("e2ee-entity-columns", () => {
  const forbidden = new Set<string>(PLAINTEXT_CONTENT_FIELD_NAMES);

  it("detail columns are a superset of list ciphertext columns per entity", () => {
    const pairs: Array<[keyof typeof E2EE_LIST_COLUMNS, string[]]> = [
      ["items", ["encrypted_title"]],
      ["notes", ["encrypted_title"]],
      ["contacts", ["encrypted_first_name", "encrypted_last_name"]],
      ["links", ["encrypted_name", "encrypted_url"]],
      ["link_folders", ["encrypted_name"]],
    ];

    for (const [entity, ciphertextColumns] of pairs) {
      const list = E2EE_LIST_COLUMNS[entity];
      const detail = E2EE_DETAIL_COLUMNS[entity];
      for (const column of ciphertextColumns) {
        expect(list).toContain(column);
        expect(detail).toContain(column);
      }
    }
  });

  it("list projections include structural metadata for grouped views", () => {
    expect(E2EE_LIST_COLUMNS.items).toContain("stage_id");
    expect(E2EE_LIST_COLUMNS.items).toContain("sort_order");
    expect(E2EE_LIST_COLUMNS.items).toContain("created_at");
    expect(E2EE_LIST_COLUMNS.notes).toContain("category_id");
    expect(E2EE_LIST_COLUMNS.contacts).toContain("category_id");
    expect(E2EE_LIST_COLUMNS.links).toContain("folder_id");
    expect(E2EE_LIST_COLUMNS.links).toContain("encrypted_url");
    expect(E2EE_LIST_COLUMNS.link_folders).toContain("parent_folder_id");
  });

  it("never includes plaintext content field names or star selects", () => {
    const all = [
      ...Object.values(E2EE_LIST_COLUMNS),
      ...Object.values(E2EE_DETAIL_COLUMNS),
      ...Object.values(E2EE_PREFETCH_COLUMNS),
      CONTACT_LINK_PICKER_COLUMNS,
    ];

    for (const select of all) {
      expect(select).not.toMatch(/\*/);
      for (const column of columnTokens(select)) {
        expect(forbidden.has(column)).toBe(false);
      }
    }
  });
});
