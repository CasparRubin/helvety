import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseChromeExtensionOriginsEnv } from "./chrome-extension-origin-parse";

/** Mirrors HELVETY_CHROME_EXTENSION_ORIGINS transform in lib/env.ts */
const chromeExtensionOriginsField = z
  .string()
  .min(1)
  .transform((raw, ctx) => {
    try {
      return parseChromeExtensionOriginsEnv(raw);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Invalid HELVETY_CHROME_EXTENSION_ORIGINS",
      });
      return z.NEVER;
    }
  });

describe("auth env HELVETY_CHROME_EXTENSION_ORIGINS transform", () => {
  it("normalizes bare extension ids the same way as parseChromeExtensionOriginsEnv", () => {
    const edgeId = "kjdldfioiofpblkchjodefakpopmkjjf";
    const parsed = chromeExtensionOriginsField.parse(edgeId);
    expect(parsed).toEqual([`chrome-extension://${edgeId}`]);
  });

  it("accepts comma-separated bare ids for multiple Chromium builds", () => {
    const a = "kjdldfioiofpblkchjodefakpopmkjjf";
    const b = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const parsed = chromeExtensionOriginsField.parse(`${a},${b}`);
    expect(parsed).toEqual([
      `chrome-extension://${a}`,
      `chrome-extension://${b}`,
    ]);
  });
});
