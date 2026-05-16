import { describe, expect, it } from "vitest";

import { ALL_FOLDER_ID, ALL_FOLDER_NAME } from "./all-folder";
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
    name: "Work",
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
    id: "l0",
    user_id: "u",
    folder_id: null,
    name: "In All",
    url: "https://example.com/0",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
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
  it("getChildren at tree root returns only All", () => {
    const root = getChildren(folders, links, null);
    expect(root.folders).toHaveLength(1);
    expect(root.folders[0]?.id).toBe(ALL_FOLDER_ID);
    expect(root.folders[0]?.name).toBe(ALL_FOLDER_NAME);
    expect(root.links).toHaveLength(0);
  });

  it("getChildren at tree root returns All even when the library is empty", () => {
    const root = getChildren([], [], null);
    expect(root.folders).toHaveLength(1);
    expect(root.folders[0]?.id).toBe(ALL_FOLDER_ID);
    expect(root.links).toHaveLength(0);
  });

  it("getChildren inside All returns top-level library items", () => {
    const inAll = getChildren(folders, links, ALL_FOLDER_ID);
    expect(inAll.folders.map((f) => f.id)).toEqual(["a"]);
    expect(inAll.links.map((l) => l.id)).toEqual(["l0"]);

    const inA = getChildren(folders, links, "a");
    expect(inA.folders.map((f) => f.id)).toEqual(["b"]);
    expect(inA.links.map((l) => l.id)).toEqual(["l1"]);
  });

  it("getBreadcrumbs prefixes All", () => {
    expect(getBreadcrumbs(folders, "b")).toEqual([
      { id: ALL_FOLDER_ID, name: ALL_FOLDER_NAME },
      { id: "a", name: "Work" },
      { id: "b", name: "Child B" },
    ]);
  });

  it("canMoveFolderToParent rejects the All folder and descendants", () => {
    expect(canMoveFolderToParent(folders, ALL_FOLDER_ID, null)).toBe(false);
    expect(canMoveFolderToParent(folders, "a", "b")).toBe(false);
    expect(canMoveFolderToParent(folders, "a", ALL_FOLDER_ID)).toBe(true);
  });

  it("listLinksInFolder and listLinksInFolderTree handle All", () => {
    expect(listLinksInFolder(links, ALL_FOLDER_ID).map((l) => l.id)).toEqual([
      "l0",
    ]);
    expect(
      listLinksInFolderTree(folders, links, ALL_FOLDER_ID).map((l) => l.id)
    ).toEqual(["l0", "l1", "l2"]);
    expect(listLinksInFolderTree(folders, links, "a").map((l) => l.id)).toEqual(
      ["l1", "l2"]
    );
  });

  it("getDescendantFolderIds from All includes every folder", () => {
    expect(getDescendantFolderIds(folders, ALL_FOLDER_ID)).toEqual(["a", "b"]);
    expect(getDescendantFolderIds(folders, "a")).toEqual(["b"]);
  });

  it("formatFolderPath uses All instead of Root", () => {
    expect(formatFolderPath(folders, null)).toBe(ALL_FOLDER_NAME);
    expect(formatFolderPath(folders, ALL_FOLDER_ID)).toBe(ALL_FOLDER_NAME);
    expect(formatFolderPath(folders, "b")).toBe("All / Work / Child B");
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
    expect(
      getChildren(manyFolders, [], ALL_FOLDER_ID).folders.map((f) => f.id)
    ).toEqual(["early", "late"]);
  });
});
