import { describe, expect, it } from "vitest";

import {
  buildEntityDeleteMessage,
  defineEntityDeleteRegistry,
  type EntityDeleteConfig,
} from "./entity-delete-message";

/** Example entity type ids used across the delete-message tests. */
type ExampleType = "note" | "folder" | "task";

const configMap: Record<ExampleType, EntityDeleteConfig> = {
  note: { name: "note", plural: "notes", hasChildren: false },
  task: { name: "task", plural: "tasks", hasChildren: false },
  folder: {
    name: "folder",
    plural: "folders",
    hasChildren: true,
    childExamples: ["links", "subfolders"],
  },
};

describe("buildEntityDeleteMessage", () => {
  it("uses a generic fallback for an unknown entity type", () => {
    const result = buildEntityDeleteMessage(
      configMap,
      "unknown" as ExampleType
    );
    expect(result.title).toBe("Delete this entry?");
    expect(result.description).toBe(
      "This action is permanent and cannot be undone."
    );
  });

  it("includes the entity name in the fallback title when provided", () => {
    const result = buildEntityDeleteMessage(
      configMap,
      "unknown" as ExampleType,
      "My Item"
    );
    expect(result.title).toBe('Delete "My Item"?');
  });

  it("builds a childless message with the type name", () => {
    const result = buildEntityDeleteMessage(configMap, "note");
    expect(result.title).toBe("Delete this note?");
    expect(result.description).toBe(
      "This will permanently delete this note. This action is permanent and cannot be undone."
    );
  });

  it("prefers the entity name in the title when provided", () => {
    expect(buildEntityDeleteMessage(configMap, "note", "Shopping").title).toBe(
      'Delete "Shopping"?'
    );
  });

  it("lists child examples for entities with children", () => {
    const result = buildEntityDeleteMessage(configMap, "folder");
    expect(result.title).toBe("Delete this folder?");
    expect(result.description).toContain("including links, subfolders");
  });

  it("uses a generic phrase when a parent has no child examples", () => {
    const sparse: Record<"box", EntityDeleteConfig> = {
      box: { name: "box", plural: "boxes", hasChildren: true },
    };
    expect(buildEntityDeleteMessage(sparse, "box").description).toContain(
      "including nested content"
    );
  });
});

describe("defineEntityDeleteRegistry", () => {
  it("binds buildDeleteMessage to the provided config map", () => {
    const { buildDeleteMessage } = defineEntityDeleteRegistry(configMap);
    expect(buildDeleteMessage("folder")).toEqual(
      buildEntityDeleteMessage(configMap, "folder")
    );
    expect(buildDeleteMessage("note", "Groceries").title).toBe(
      'Delete "Groceries"?'
    );
  });
});
