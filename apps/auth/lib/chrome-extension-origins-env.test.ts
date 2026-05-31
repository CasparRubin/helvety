import { afterEach, describe, expect, it } from "vitest";

import { readChromeExtensionOriginsFromProcessEnv } from "./chrome-extension-origins-env";

describe("readChromeExtensionOriginsFromProcessEnv", () => {
  afterEach(() => {
    delete process.env.HELVETY_CHROME_EXTENSION_ORIGINS;
  });

  it("reads HELVETY_CHROME_EXTENSION_ORIGINS from process env (full origin)", () => {
    process.env.HELVETY_CHROME_EXTENSION_ORIGINS =
      "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

    expect(readChromeExtensionOriginsFromProcessEnv()).toBe(
      "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef"
    );
  });

  it("reads bare extension id string unchanged (normalization happens in env Zod transform)", () => {
    process.env.HELVETY_CHROME_EXTENSION_ORIGINS =
      "kjdldfioiofpblkchjodefakpopmkjjf";

    expect(readChromeExtensionOriginsFromProcessEnv()).toBe(
      "kjdldfioiofpblkchjodefakpopmkjjf"
    );
  });

  it("returns empty string when unset", () => {
    expect(readChromeExtensionOriginsFromProcessEnv()).toBe("");
  });
});
