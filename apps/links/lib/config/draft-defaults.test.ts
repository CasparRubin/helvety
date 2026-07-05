import { describe, expect, it } from "vitest";

import { resolveLinkDisplayName } from "@/lib/url-normalize";

import {
  createLinkDraftSnapshot,
  isLinkDraftUnchanged,
  LINK_DRAFT_DEFAULT_NAME,
  LINK_DRAFT_PLACEHOLDER_URL,
} from "./draft-defaults";

describe("links draft-defaults", () => {
  it("isLinkDraftUnchanged detects matching draft", () => {
    const snapshot = createLinkDraftSnapshot(
      "example.com",
      LINK_DRAFT_PLACEHOLDER_URL,
      null
    );
    expect(
      isLinkDraftUnchanged(
        {
          id: "1",
          user_id: "u",
          name: "example.com",
          url: LINK_DRAFT_PLACEHOLDER_URL,
          folder_id: null,
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
        snapshot
      )
    ).toBe(true);
  });

  it("empty-name draft snapshot matches resolveLinkDisplayName seed row", () => {
    const displayName = resolveLinkDisplayName(
      LINK_DRAFT_DEFAULT_NAME,
      LINK_DRAFT_PLACEHOLDER_URL
    );
    const snapshot = createLinkDraftSnapshot(
      displayName,
      LINK_DRAFT_PLACEHOLDER_URL,
      null
    );
    expect(
      isLinkDraftUnchanged(
        {
          id: "1",
          user_id: "u",
          name: displayName,
          url: LINK_DRAFT_PLACEHOLDER_URL,
          folder_id: null,
          sort_order: 0,
          created_at: "",
          updated_at: "",
        },
        snapshot
      )
    ).toBe(true);
  });
});
