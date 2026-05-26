import { afterEach, describe, expect, it } from "vitest";

import { readChromeExtensionOriginsFromProcessEnv } from "./chrome-extension-origins-env";

describe("readChromeExtensionOriginsFromProcessEnv", () => {
  afterEach(() => {
    delete process.env.HELVETY_CHROME_EXTENSION_ORIGINS;
    delete process.env.HELVEETY_CHROME_EXTENSION_ORIGINS;
  });

  it("prefers HELVETY_CHROME_EXTENSION_ORIGINS over legacy spelling", () => {
    process.env.HELVEETY_CHROME_EXTENSION_ORIGINS =
      "chrome-extension://legacy-id";
    process.env.HELVETY_CHROME_EXTENSION_ORIGINS =
      "chrome-extension://preferred-id";

    expect(readChromeExtensionOriginsFromProcessEnv()).toBe(
      "chrome-extension://preferred-id"
    );
  });

  it("falls back to HELVEETY_CHROME_EXTENSION_ORIGINS when preferred is unset", () => {
    process.env.HELVEETY_CHROME_EXTENSION_ORIGINS =
      "chrome-extension://legacy-id";

    expect(readChromeExtensionOriginsFromProcessEnv()).toBe(
      "chrome-extension://legacy-id"
    );
  });
});
