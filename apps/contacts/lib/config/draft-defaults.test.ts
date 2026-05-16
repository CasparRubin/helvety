import { describe, expect, it } from "vitest";

import { DEFAULT_CONTACT_CATEGORY_ID } from "@/lib/config/default-categories";

import {
  CONTACT_DRAFT_FIRST_NAME,
  CONTACT_DRAFT_LAST_NAME,
  createContactDraftSnapshot,
  isContactDraftUnchanged,
} from "./draft-defaults";

describe("contacts draft-defaults", () => {
  it("isContactDraftUnchanged detects matching pristine draft", () => {
    const snapshot = createContactDraftSnapshot(DEFAULT_CONTACT_CATEGORY_ID);
    expect(
      isContactDraftUnchanged(
        {
          first_name: CONTACT_DRAFT_FIRST_NAME,
          last_name: CONTACT_DRAFT_LAST_NAME,
          email: null,
          phone: null,
          birthday: null,
          description: null,
          notes: null,
          category_id: DEFAULT_CONTACT_CATEGORY_ID,
        },
        snapshot
      )
    ).toBe(true);
  });

  it("isContactDraftUnchanged returns false after name changes", () => {
    const snapshot = createContactDraftSnapshot(DEFAULT_CONTACT_CATEGORY_ID);
    expect(
      isContactDraftUnchanged(
        {
          first_name: "Ada",
          last_name: CONTACT_DRAFT_LAST_NAME,
          email: null,
          phone: null,
          birthday: null,
          description: null,
          notes: null,
          category_id: DEFAULT_CONTACT_CATEGORY_ID,
        },
        snapshot
      )
    ).toBe(false);
  });
});
