import { describe, expect, it } from "vitest";

import {
  ALL_FOLDER_ID,
  ALL_FOLDER_NAME,
  createAllFolder,
  isAllFolderId,
  toDisplayFolderId,
  toStorageFolderId,
} from "./all-folder";

describe("all-folder", () => {
  it("identifies the virtual All folder id", () => {
    expect(isAllFolderId(ALL_FOLDER_ID)).toBe(true);
    expect(isAllFolderId("other")).toBe(false);
  });

  it("maps between storage null and display All id", () => {
    expect(toStorageFolderId(ALL_FOLDER_ID)).toBeNull();
    expect(toStorageFolderId(null)).toBeNull();
    expect(toStorageFolderId("")).toBeNull();
    expect(toStorageFolderId("folder-a")).toBe("folder-a");
    expect(toDisplayFolderId(null)).toBe(ALL_FOLDER_ID);
    expect(toDisplayFolderId("folder-a")).toBe("folder-a");
  });

  it("creates the synthetic All folder", () => {
    expect(createAllFolder("user-1")).toMatchObject({
      id: ALL_FOLDER_ID,
      user_id: "user-1",
      name: ALL_FOLDER_NAME,
      parent_folder_id: null,
    });
  });
});
