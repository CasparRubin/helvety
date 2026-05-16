import { describe, expect, it } from "vitest";

import { ALL_FOLDER_ID } from "./all-folder";
import {
  listVisibleTreeDragIds,
  parseFolderDropId,
  parseTreeDragId,
  resolveTreeDropAction,
  toFolderDropId,
  toTreeDragId,
} from "./link-tree-dnd";

import type { Link, LinkFolder } from "@/lib/types";

const folders: LinkFolder[] = [
  {
    id: "folder-a",
    user_id: "u",
    parent_folder_id: null,
    name: "A",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
  {
    id: "folder-b",
    user_id: "u",
    parent_folder_id: "folder-a",
    name: "B",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
];

const links: Link[] = [
  {
    id: "link-1",
    user_id: "u",
    folder_id: "folder-a",
    name: "One",
    url: "https://one.example",
    sort_order: 0,
    created_at: "1",
    updated_at: "1",
  },
];

describe("link-tree-dnd ids", () => {
  it("round-trips folder and link drag ids", () => {
    expect(parseTreeDragId(toTreeDragId("folder", "abc"))).toEqual({
      kind: "folder",
      id: "abc",
    });
    expect(parseTreeDragId(toTreeDragId("link", "xyz"))).toEqual({
      kind: "link",
      id: "xyz",
    });
    expect(parseTreeDragId("invalid")).toBeNull();
  });

  it("round-trips folder drop targets including All", () => {
    expect(parseFolderDropId(toFolderDropId(null))).toEqual({
      kind: "folder-drop",
      folderId: ALL_FOLDER_ID,
    });
    expect(parseFolderDropId(toFolderDropId(ALL_FOLDER_ID))).toEqual({
      kind: "folder-drop",
      folderId: ALL_FOLDER_ID,
    });
    expect(parseFolderDropId(toFolderDropId("folder-b"))).toEqual({
      kind: "folder-drop",
      folderId: "folder-b",
    });
    expect(parseFolderDropId("folder-a")).toBeNull();
  });
});

describe("listVisibleTreeDragIds", () => {
  it("lists depth-first ids when ancestor folders are expanded", () => {
    const expanded = new Set([ALL_FOLDER_ID, "folder-a"]);
    expect(listVisibleTreeDragIds(folders, links, expanded)).toEqual([
      toTreeDragId("folder", ALL_FOLDER_ID),
      toTreeDragId("folder", "folder-a"),
      toTreeDragId("folder", "folder-b"),
      toTreeDragId("link", "link-1"),
    ]);
  });

  it("hides nested items when All is collapsed", () => {
    expect(listVisibleTreeDragIds(folders, links, new Set())).toEqual([
      toTreeDragId("folder", ALL_FOLDER_ID),
    ]);
  });
});

describe("resolveTreeDropAction", () => {
  it("moves a link from All into a folder via drop target", () => {
    const libraryLinks: Link[] = [
      ...links,
      {
        id: "link-2",
        user_id: "u",
        folder_id: null,
        name: "Two",
        url: "https://two.example",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
    ];
    const action = resolveTreeDropAction(
      folders,
      libraryLinks,
      toTreeDragId("link", "link-2"),
      toFolderDropId("folder-b")
    );
    expect(action?.type).toBe("move-link");
    if (action?.type === "move-link") {
      expect(action.targetFolderId).toBe("folder-b");
      expect(action.linkId).toBe("link-2");
    }
  });

  it("moves a link to All via All drop target", () => {
    const action = resolveTreeDropAction(
      folders,
      links,
      toTreeDragId("link", "link-1"),
      toFolderDropId(null)
    );
    expect(action?.type).toBe("move-link");
    if (action?.type === "move-link") {
      expect(action.targetFolderId).toBeNull();
    }
  });

  it("reorders folders within All (null parent in storage)", () => {
    const siblings: LinkFolder[] = [
      {
        id: "f1",
        user_id: "u",
        parent_folder_id: null,
        name: "First",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
      {
        id: "f2",
        user_id: "u",
        parent_folder_id: null,
        name: "Second",
        sort_order: 1,
        created_at: "1",
        updated_at: "1",
      },
    ];
    const action = resolveTreeDropAction(
      siblings,
      [],
      toTreeDragId("folder", "f2"),
      toTreeDragId("folder", "f1")
    );
    expect(action?.type).toBe("reorder-folders");
    if (action?.type === "reorder-folders") {
      expect(action.parentFolderId).toBeNull();
      expect(action.updates.map((u) => u.id)).toEqual(["f2", "f1"]);
    }
  });

  it("reorders links within the same folder", () => {
    const siblings: Link[] = [
      {
        id: "l1",
        user_id: "u",
        folder_id: "folder-a",
        name: "A",
        url: "https://a.example",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
      {
        id: "l2",
        user_id: "u",
        folder_id: "folder-a",
        name: "B",
        url: "https://b.example",
        sort_order: 1,
        created_at: "1",
        updated_at: "1",
      },
    ];
    const action = resolveTreeDropAction(
      folders,
      siblings,
      toTreeDragId("link", "l2"),
      toTreeDragId("link", "l1")
    );
    expect(action?.type).toBe("reorder-links");
    if (action?.type === "reorder-links") {
      expect(action.folderId).toBe("folder-a");
      expect(action.updates.map((u) => u.id)).toEqual(["l2", "l1"]);
    }
  });

  it("moves a folder when dropped on a folder in a different parent", () => {
    const library: LinkFolder[] = [
      {
        id: "root-target",
        user_id: "u",
        parent_folder_id: null,
        name: "Target",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
      {
        id: "nested-parent",
        user_id: "u",
        parent_folder_id: null,
        name: "Nested parent",
        sort_order: 1,
        created_at: "1",
        updated_at: "1",
      },
      {
        id: "nested-child",
        user_id: "u",
        parent_folder_id: "nested-parent",
        name: "Nested child",
        sort_order: 0,
        created_at: "1",
        updated_at: "1",
      },
    ];
    const action = resolveTreeDropAction(
      library,
      [],
      toTreeDragId("folder", "nested-child"),
      toTreeDragId("folder", "root-target")
    );
    expect(action?.type).toBe("move-folder");
    if (action?.type === "move-folder") {
      expect(action.targetParentId).toBe("root-target");
      expect(action.folderId).toBe("nested-child");
    }
  });

  it("moves a link from All onto a folder row", () => {
    const action = resolveTreeDropAction(
      folders,
      [
        {
          id: "link-in-all",
          user_id: "u",
          folder_id: null,
          name: "In All",
          url: "https://in-all.example",
          sort_order: 0,
          created_at: "1",
          updated_at: "1",
        },
      ],
      toTreeDragId("link", "link-in-all"),
      toTreeDragId("folder", "folder-a")
    );
    expect(action?.type).toBe("move-link");
    if (action?.type === "move-link") {
      expect(action.targetFolderId).toBe("folder-a");
    }
  });

  it("moves a nested folder into All via the All folder row", () => {
    const action = resolveTreeDropAction(
      folders,
      links,
      toTreeDragId("folder", "folder-b"),
      toTreeDragId("folder", ALL_FOLDER_ID)
    );
    expect(action?.type).toBe("move-folder");
    if (action?.type === "move-folder") {
      expect(action.targetParentId).toBeNull();
      expect(action.folderId).toBe("folder-b");
    }
  });

  it("rejects moving the virtual All folder", () => {
    expect(
      resolveTreeDropAction(
        folders,
        links,
        toTreeDragId("folder", ALL_FOLDER_ID),
        toFolderDropId("folder-a")
      )
    ).toBeNull();
  });

  it("rejects moving a top-level folder onto a link in a nested folder", () => {
    const action = resolveTreeDropAction(
      folders,
      links,
      toTreeDragId("folder", "folder-a"),
      toTreeDragId("link", "link-1")
    );
    expect(action).toBeNull();
  });

  it("rejects moving a folder into its descendant", () => {
    const action = resolveTreeDropAction(
      folders,
      links,
      toTreeDragId("folder", "folder-a"),
      toFolderDropId("folder-b")
    );
    expect(action).toBeNull();
  });

  it("returns null for unknown drag ids", () => {
    expect(
      resolveTreeDropAction(
        folders,
        links,
        "bad-id",
        toTreeDragId("link", "link-1")
      )
    ).toBeNull();
  });
});
