import { describe, expect, it } from "vitest";

import { DEV_PORTS, getLocalAppHref, urls } from "./config";

describe("urls and DEV_PORTS", () => {
  it("exposes the links zone on the gateway and dev port 3009", () => {
    expect(urls.links).toMatch(/\/links$/);
    expect(DEV_PORTS.links).toBe(3009);
  });

  it("exposes the OCR zone on dev port 3011", () => {
    expect(urls.ocr).toMatch(/\/ocr$/);
    expect(DEV_PORTS.ocr).toBe(3011);
  });

  it("defines eleven unique dev ports across all zones", () => {
    const ports = Object.values(DEV_PORTS);
    expect(ports).toHaveLength(11);
    expect(new Set(ports).size).toBe(11);
  });
});

describe("getLocalAppHref (gateway path helper: not for cross-zone Link inside basePath apps)", () => {
  it("returns local paths unchanged", () => {
    expect(getLocalAppHref("/store")).toBe("/store");
    expect(getLocalAppHref("/notes?tab=all#section")).toBe(
      "/notes?tab=all#section"
    );
  });

  it("converts helvety absolute URLs to root-relative paths", () => {
    expect(getLocalAppHref("https://helvety.com/store")).toBe("/store");
    expect(getLocalAppHref("https://helvety.com/tasks?view=board#top")).toBe(
      "/tasks?view=board#top"
    );
    expect(getLocalAppHref("https://preview.helvety.com/contacts")).toBe(
      "/contacts"
    );
  });

  it("converts localhost gateway URLs to root-relative paths", () => {
    expect(getLocalAppHref("http://localhost:3001/store")).toBe("/store");
    expect(getLocalAppHref("http://127.0.0.1:3001/notes")).toBe("/notes");
    expect(getLocalAppHref("http://127.0.0.1:3001/links")).toBe("/links");
  });

  it("keeps external absolute URLs unchanged", () => {
    expect(getLocalAppHref("https://example.com/store")).toBe(
      "https://example.com/store"
    );
  });

  it("falls back to original value for invalid URLs", () => {
    expect(getLocalAppHref("not a valid URL")).toBe("not a valid URL");
  });
});
