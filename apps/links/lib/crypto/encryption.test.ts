import { describe, expect, it } from "vitest";

import { buildAAD } from "./encryption";
import * as linkEncryption from "./link-encryption";
import * as folderEncryption from "./link-folder-encryption";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("links crypto buildAAD", () => {
  it("accepts link_folders and links table names", () => {
    expect(buildAAD("link_folders", VALID_UUID)).toBe(
      `link_folders:${VALID_UUID}`
    );
    expect(buildAAD("links", VALID_UUID)).toBe(`links:${VALID_UUID}`);
  });

  it("rejects invalid table names", () => {
    expect(() => buildAAD("stages", VALID_UUID)).toThrow(
      "Invalid AAD table name"
    );
  });

  it("rejects invalid UUID record ids", () => {
    expect(() => buildAAD("links", "not-a-uuid")).toThrow(
      "Invalid AAD record ID"
    );
  });
});

describe("links encryption module surface", () => {
  it("exposes folder encrypt/decrypt entrypoints", () => {
    expect(typeof folderEncryption.encryptFolderInput).toBe("function");
    expect(typeof folderEncryption.encryptFolderUpdate).toBe("function");
    expect(typeof folderEncryption.decryptFolderRow).toBe("function");
    expect(typeof folderEncryption.decryptFolderRows).toBe("function");
  });

  it("exposes link encrypt/decrypt entrypoints", () => {
    expect(typeof linkEncryption.encryptLinkInput).toBe("function");
    expect(typeof linkEncryption.encryptLinkUpdate).toBe("function");
    expect(typeof linkEncryption.decryptLinkRow).toBe("function");
    expect(typeof linkEncryption.decryptLinkRows).toBe("function");
  });
});
