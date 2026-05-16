import { describe, expect, it } from "vitest";

import {
  canMoveFolderToParent,
  formatFolderPath,
  getBreadcrumbs,
  getChildren,
  getDescendantFolderIds,
  listLinksInFolder,
  listLinksInFolderTree,
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
    url: "https://example.com/1",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
  {
    id: "l2",
    user_id: "u",
    folder_id: "b",
    name: "Link 2",
    url: "https://example.com/2",
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

  it("listLinksInFolder returns direct links only", () => {
    expect(listLinksInFolder(links, "a").map((l) => l.id)).toEqual(["l1"]);
    expect(listLinksInFolder(links, "b").map((l) => l.id)).toEqual(["l2"]);
  });

  it("listLinksInFolderTree includes nested folder links", () => {
    expect(listLinksInFolderTree(folders, links, "a").map((l) => l.id)).toEqual(
      ["l1", "l2"]
    );
    expect(listLinksInFolderTree(folders, links, "b").map((l) => l.id)).toEqual(
      ["l2"]
    );
  });

  it("getDescendantFolderIds returns nested folder ids only", () => {
    expect(getDescendantFolderIds(folders, "a")).toEqual(["b"]);
    expect(getDescendantFolderIds(folders, "b")).toEqual([]);
  });

  it("formatFolderPath renders root and nested paths", () => {
    expect(formatFolderPath(folders, null)).toBe("Root");
    expect(formatFolderPath(folders, "b")).toBe("Root A / Child B");
  });

  it("getChildren sorts by sort_order then created_at", () => {
    const manyFolders: LinkFolder[] = [
      {
        id: "late",
        user_id: "u",
        parent_folder_id: null,
        name: "Late",
        sort_order: 1,
        created_at: "2",
        updated_at: "1",
      },
      {
        id: "early",
        user_id: "u",
        parent_folder_id: null,
        name: "Early",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
    ];
    expect(getChildren(manyFolders, [], null).folders.map((f) => f.id)).toEqual(
      ["early", "late"]
    );
  });
});
