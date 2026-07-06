import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONTACT_CATEGORY_ID,
  DEFAULT_NOTE_CATEGORY_ID,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STAGE_ID,
} from "./e2ee-entity-defaults";
import {
  draftForKind,
  serializeFormDraft,
  validateE2eeDraft,
} from "./validate-e2ee-draft";

describe("validateE2eeDraft", () => {
  it("requires task and note titles", () => {
    expect(validateE2eeDraft({ kind: "tasks", value: { title: "  " } })).toBe(
      "Title is required."
    );
    expect(validateE2eeDraft({ kind: "tasks", value: { title: "Ship" } })).toBe(
      null
    );
    expect(validateE2eeDraft({ kind: "notes", value: { title: "" } })).toBe(
      "Title is required."
    );
    expect(validateE2eeDraft({ kind: "notes", value: { title: "Note" } })).toBe(
      null
    );
  });

  it("requires contact first name", () => {
    expect(
      validateE2eeDraft({
        kind: "contacts",
        value: { first_name: " ", last_name: "Lovelace" },
      })
    ).toBe("First name is required.");
    expect(
      validateE2eeDraft({
        kind: "contacts",
        value: { first_name: "Ada", last_name: "" },
      })
    ).toBe(null);
  });

  it("requires link name and url", () => {
    expect(
      validateE2eeDraft({
        kind: "links",
        value: { name: "", url: "https://x" },
      })
    ).toBe("Name is required.");
    expect(
      validateE2eeDraft({ kind: "links", value: { name: "X", url: "  " } })
    ).toBe("URL is required.");
    expect(
      validateE2eeDraft({
        kind: "links",
        value: { name: "Helvety", url: "https://helvety.com" },
      })
    ).toBe(null);
  });

  it("requires link folder name", () => {
    expect(
      validateE2eeDraft({ kind: "link_folder", value: { name: "  " } })
    ).toBe("Folder name is required.");
    expect(
      validateE2eeDraft({ kind: "link_folder", value: { name: "Bookmarks" } })
    ).toBe(null);
  });
});

describe("draftForKind", () => {
  it("returns empty inputs for each entity kind", () => {
    expect(draftForKind("contacts")).toEqual({
      kind: "contacts",
      value: {
        first_name: "",
        last_name: "",
        description: null,
        email: null,
        phone: null,
        birthday: null,
        notes: null,
        category_id: DEFAULT_CONTACT_CATEGORY_ID,
      },
    });
    expect(draftForKind("notes")).toEqual({
      kind: "notes",
      value: {
        title: "",
        description: null,
        category_id: DEFAULT_NOTE_CATEGORY_ID,
      },
    });
    expect(draftForKind("tasks")).toEqual({
      kind: "tasks",
      value: {
        title: "",
        description: null,
        start_date: null,
        end_date: null,
        stage_id: DEFAULT_TASK_STAGE_ID,
        label_id: null,
        priority: DEFAULT_TASK_PRIORITY,
      },
    });
    expect(draftForKind("links")).toEqual({
      kind: "links",
      value: { name: "", url: "", folder_id: null },
    });
    expect(draftForKind("link_folder")).toEqual({
      kind: "link_folder",
      value: { name: "", parent_folder_id: null },
    });
  });
});

describe("serializeFormDraft", () => {
  it("returns stable JSON for unsaved-changes detection", () => {
    const draft = draftForKind("notes");
    expect(serializeFormDraft(draft)).toBe(JSON.stringify(draft));
  });
});
