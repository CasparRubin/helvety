import { describe, expect, it } from "vitest";

import { parseChromeExtensionOriginsEnv } from "./chrome-extension-origin-parse";

const ALLOWED_ID = "abcdefghijklmnopqrstuvwxyzabcdef";
const ALLOWED = `chrome-extension://${ALLOWED_ID}`;
const EDGE_DEV_ID = "kjdldfioiofpblkchjodefakpopmkjjf";

describe("parseChromeExtensionOriginsEnv", () => {
  it("parses a single full chrome-extension origin (legacy)", () => {
    expect(parseChromeExtensionOriginsEnv(ALLOWED)).toEqual([ALLOWED]);
  });

  it("parses a single bare extension id", () => {
    expect(parseChromeExtensionOriginsEnv(EDGE_DEV_ID)).toEqual([
      `chrome-extension://${EDGE_DEV_ID}`,
    ]);
  });

  it("parses comma-separated bare ids", () => {
    const second = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(parseChromeExtensionOriginsEnv(`${EDGE_DEV_ID}, ${second}`)).toEqual(
      [`chrome-extension://${EDGE_DEV_ID}`, `chrome-extension://${second}`]
    );
  });

  it("parses comma-separated full origins", () => {
    const second = "chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(parseChromeExtensionOriginsEnv(`${ALLOWED}, ${second}`)).toEqual([
      ALLOWED,
      second,
    ]);
  });

  it("accepts mixed bare ids and full origins", () => {
    expect(
      parseChromeExtensionOriginsEnv(`${EDGE_DEV_ID}, ${ALLOWED}`)
    ).toEqual([`chrome-extension://${EDGE_DEV_ID}`, ALLOWED]);
  });

  it("rejects empty input", () => {
    expect(() => parseChromeExtensionOriginsEnv("")).toThrow(
      /at least one extension id/i
    );
  });

  it("rejects https origins", () => {
    expect(() =>
      parseChromeExtensionOriginsEnv("https://evil.example")
    ).toThrow(/32-character extension id/i);
  });

  it("rejects invalid bare id length", () => {
    expect(() => parseChromeExtensionOriginsEnv("tooshort")).toThrow(
      /32-character extension id/i
    );
  });

  it("rejects invalid chrome-extension URL", () => {
    expect(() => parseChromeExtensionOriginsEnv("chrome-extension://")).toThrow(
      /invalid origin/i
    );
  });
});
