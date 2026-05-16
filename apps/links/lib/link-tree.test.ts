import { describe, expect, it } from "vitest";

import {
  canMoveFolderToParent,
  getBreadcrumbs,
  getChildren,
} from "./link-tree";

import type { Link, LinkFolder } from "@/lib/types";

const folders: LinkFolder[] = [
  {
    id: "a",
    user_id: "u",
    parent_folder_id: null,
    name: "Root A",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
  {
    id: "b",
    user_id: "u",
    parent_folder_id: "a",
    name: "Child B",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
];

const links: Link[] = [
  {
    id: "l1",
    user_id: "u",
    folder_id: "a",
    name: "Link 1",
    url: "https://example.com",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
];

describe("link-tree", () => {
  it("getChildren returns root and nested items", () => {
    const root = getChildren(folders, links, null);
    expect(root.folders.map((f) => f.id)).toEqual(["a"]);
    expect(root.links).toHaveLength(0);

    const inA = getChildren(folders, links, "a");
    expect(inA.folders.map((f) => f.id)).toEqual(["b"]);
    expect(inA.links.map((l) => l.id)).toEqual(["l1"]);
  });

  it("getBreadcrumbs walks ancestors", () => {
    expect(getBreadcrumbs(folders, "b")).toEqual([
      { id: "a", name: "Root A" },
      { id: "b", name: "Child B" },
    ]);
  });

  it("canMoveFolderToParent rejects descendant target", () => {
    expect(canMoveFolderToParent(folders, "a", "b")).toBe(false);
    expect(canMoveFolderToParent(folders, "a", null)).toBe(true);
  });
});
