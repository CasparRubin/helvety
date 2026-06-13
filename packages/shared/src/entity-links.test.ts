import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ENTITY_LINK_COLUMNS } from "./entity-links";

const entityLinksSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "entity-links.ts"),
  "utf8"
);

describe("ENTITY_LINK_COLUMNS", () => {
  it("lists explicit entity_links columns without wildcards", () => {
    expect(ENTITY_LINK_COLUMNS).toContain("source_entity_type");
    expect(ENTITY_LINK_COLUMNS).toContain("target_entity_id");
    expect(ENTITY_LINK_COLUMNS).not.toContain("*");
  });
});

describe("LinkEntityType table mapping", () => {
  it("includes links bookmarks table", () => {
    expect(entityLinksSrc).toContain(
      '"notes" | "items" | "contacts" | "links"'
    );
    expect(entityLinksSrc).toContain('links: "links"');
  });
});
