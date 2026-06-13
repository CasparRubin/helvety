import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ENTITY_LINK_COLUMNS } from "./entity-links-client";

describe("ENTITY_LINK_COLUMNS", () => {
  it("lists explicit entity_links columns without wildcards", () => {
    expect(ENTITY_LINK_COLUMNS).toContain("source_entity_type");
    expect(ENTITY_LINK_COLUMNS).toContain("target_entity_id");
    expect(ENTITY_LINK_COLUMNS).not.toContain("*");
  });
});

describe("entity-links server re-export", () => {
  it("re-exports client module from server-only entry", async () => {
    const serverModule = await import("./entity-links");
    expect(serverModule.ENTITY_LINK_COLUMNS).toBe(ENTITY_LINK_COLUMNS);
    expect(typeof serverModule.createEntityLink).toBe("function");
  });
});
