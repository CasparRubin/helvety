import { afterEach, describe, expect, it, vi } from "vitest";

import { readExtensionId, readExtensionVersion } from "./extension-version";

describe("readExtensionVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the manifest version inside an extension context", () => {
    vi.stubGlobal("chrome", {
      runtime: { getManifest: () => ({ version: "1.2.3" }) },
    });
    expect(readExtensionVersion()).toBe("1.2.3");
  });

  it("returns an empty string when chrome is unavailable", () => {
    vi.stubGlobal("chrome", undefined);
    expect(readExtensionVersion()).toBe("");
  });

  it("returns an empty string when getManifest is missing", () => {
    vi.stubGlobal("chrome", { runtime: {} });
    expect(readExtensionVersion()).toBe("");
  });
});

describe("readExtensionId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the runtime id inside an extension context", () => {
    vi.stubGlobal("chrome", { runtime: { id: "extension-id-123" } });
    expect(readExtensionId()).toBe("extension-id-123");
  });

  it("returns an empty string when chrome is unavailable", () => {
    vi.stubGlobal("chrome", undefined);
    expect(readExtensionId()).toBe("");
  });

  it("returns an empty string when the runtime id is missing", () => {
    vi.stubGlobal("chrome", { runtime: {} });
    expect(readExtensionId()).toBe("");
  });
});
