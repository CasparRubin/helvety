import { describe, expect, it } from "vitest";

import { ENTITY_LINK_COLUMNS } from "./entity-links";

describe("ENTITY_LINK_COLUMNS", () => {
  it("lists explicit entity_links columns without wildcards", () => {
    expect(ENTITY_LINK_COLUMNS).toContain("source_entity_type");
    expect(ENTITY_LINK_COLUMNS).toContain("target_entity_id");
    expect(ENTITY_LINK_COLUMNS).not.toContain("*");
  });
});
