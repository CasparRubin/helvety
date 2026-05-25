import { describe, expect, it } from "vitest";

import { parseChromeExtensionOriginsEnv } from "./chrome-extension-origin-parse";

const ALLOWED = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

describe("parseChromeExtensionOriginsEnv", () => {
  it("parses a single origin", () => {
    expect(parseChromeExtensionOriginsEnv(ALLOWED)).toEqual([ALLOWED]);
  });

  it("parses comma-separated origins", () => {
    const second = "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(parseChromeExtensionOriginsEnv(`${ALLOWED}, ${second}`)).toEqual([
      ALLOWED,
      second,
    ]);
  });

  it("rejects empty input", () => {
    expect(() => parseChromeExtensionOriginsEnv("")).toThrow(
      /at least one chrome-extension/i
    );
  });

  it("rejects non-extension origins", () => {
    expect(() =>
      parseChromeExtensionOriginsEnv("https://evil.example")
    ).toThrow(/must start with chrome-extension/i);
  });
});
