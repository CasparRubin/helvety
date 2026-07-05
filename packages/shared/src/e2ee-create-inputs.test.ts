import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  emptyContactInput,
  emptyLinkFolderInput,
  emptyLinkInput,
  emptyNoteInput,
  emptyTaskInput,
} from "./e2ee-create-inputs";
import {
  DEFAULT_CONTACT_CATEGORY_ID,
  DEFAULT_NOTE_CATEGORY_ID,
  DEFAULT_TASK_LABEL_ID,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STAGE_ID,
} from "./e2ee-entity-defaults";

describe("e2ee-create-inputs", () => {
  it("emptyContactInput uses shared category default and empty names", () => {
    expect(emptyContactInput()).toEqual({
      first_name: "",
      last_name: "",
      description: null,
      email: null,
      phone: null,
      birthday: null,
      notes: null,
      category_id: DEFAULT_CONTACT_CATEGORY_ID,
    });
  });

  it("emptyNoteInput uses shared category default", () => {
    expect(emptyNoteInput()).toEqual({
      title: "",
      description: null,
      category_id: DEFAULT_NOTE_CATEGORY_ID,
    });
  });

  it("emptyTaskInput uses shared structural defaults", () => {
    expect(emptyTaskInput()).toEqual({
      title: "",
      description: null,
      start_date: null,
      end_date: null,
      stage_id: DEFAULT_TASK_STAGE_ID,
      label_id: DEFAULT_TASK_LABEL_ID,
      priority: DEFAULT_TASK_PRIORITY,
    });
  });

  it("emptyLinkInput starts blank", () => {
    expect(emptyLinkInput()).toEqual({ name: "", url: "", folder_id: null });
  });

  it("emptyLinkFolderInput starts blank", () => {
    expect(emptyLinkFolderInput()).toEqual({
      name: "",
      parent_folder_id: null,
    });
  });
});

describe("e2ee-create-inputs extension parity", () => {
  it("matches extension entity-drafts emptyContactInput when sibling repo is present", () => {
    const extensionDraftsPath = resolve(
      import.meta.dirname,
      "../../../helvety-browser-extension-chromium/src/popup/entity-drafts.ts"
    );
    try {
      const src = readFileSync(extensionDraftsPath, "utf8");
      expect(src).toContain("@helvety/shared/e2ee-create-inputs");
      expect(src).toContain("emptyContactInput");
      expect(emptyContactInput()).toEqual({
        first_name: "",
        last_name: "",
        description: null,
        email: null,
        phone: null,
        birthday: null,
        notes: null,
        category_id: DEFAULT_CONTACT_CATEGORY_ID,
      });
    } catch {
      // Sibling extension repo optional in some checkouts.
    }
  });
});
