import { afterEach, describe, expect, it } from "vitest";

import { readChromeExtensionOriginsFromProcessEnv } from "./chrome-extension-origins-env";

describe("readChromeExtensionOriginsFromProcessEnv", () => {
  afterEach(() => {
    delete process.env.HELVETY_CHROME_EXTENSION_ORIGINS;
  });

  it("reads HELVETY_CHROME_EXTENSION_ORIGINS from process env", () => {
    process.env.HELVETY_CHROME_EXTENSION_ORIGINS =
      "chrome-extension://extension-id";

    expect(readChromeExtensionOriginsFromProcessEnv()).toBe(
      "chrome-extension://extension-id"
    );
  });

  it("returns empty string when unset", () => {
    expect(readChromeExtensionOriginsFromProcessEnv()).toBe("");
  });
});
