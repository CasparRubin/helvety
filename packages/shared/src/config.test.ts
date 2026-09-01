import { describe, expect, it } from "vitest";

import { DEV_PORTS, getLocalAppHref, urls } from "./config";

describe("urls and DEV_PORTS", () => {
  it("exposes the PDF zone on the gateway and dev port 3003", () => {
    expect(urls.pdf).toMatch(/\/pdf$/);
    expect(DEV_PORTS.pdf).toBe(3003);
  });

  it("exposes the OCR zone on dev port 3005", () => {
    expect(urls.ocr).toMatch(/\/ocr$/);
    expect(DEV_PORTS.ocr).toBe(3005);
  });

  it("deep-links store catalog landing under the store zone", () => {
    expect(urls.storeProducts).toBe(`${urls.store}/products`);
    expect(urls.storeProducts).toMatch(/\/store\/products$/);
    expect(getLocalAppHref(urls.storeProducts)).toBe("/store/products");
    expect(getLocalAppHref("https://helvety.com/store/products")).toBe(
      "/store/products"
    );
  });

  it("defines five unique dev ports across remaining zones", () => {
    const ports = Object.values(DEV_PORTS);
    expect(ports).toHaveLength(5);
    expect(new Set(ports).size).toBe(5);
  });
});

describe("getLocalAppHref (gateway path helper: not for cross-zone Link inside basePath apps)", () => {
  it("returns local paths unchanged", () => {
    expect(getLocalAppHref("/store")).toBe("/store");
    expect(getLocalAppHref("/pdf?tab=all#section")).toBe(
      "/pdf?tab=all#section"
    );
  });

  it("converts helvety absolute URLs to root-relative paths", () => {
    expect(getLocalAppHref("https://helvety.com/store")).toBe("/store");
    expect(getLocalAppHref("https://helvety.com/pdf?view=grid#top")).toBe(
      "/pdf?view=grid#top"
    );
    expect(getLocalAppHref("https://preview.helvety.com/ocr")).toBe("/ocr");
  });

  it("converts localhost gateway URLs to root-relative paths", () => {
    expect(getLocalAppHref("http://localhost:3001/store")).toBe("/store");
    expect(getLocalAppHref("http://127.0.0.1:3001/pdf")).toBe("/pdf");
    expect(getLocalAppHref("http://127.0.0.1:3001/image-editor")).toBe(
      "/image-editor"
    );
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
