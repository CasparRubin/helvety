import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestCspNonce: vi.fn(),
}));

vi.mock("@helvety/shared/csp-nonce", () => ({
  getRequestCspNonce: mocks.getRequestCspNonce,
}));

import { StoreProductsSpeculation } from "./store-products-speculation";

describe("StoreProductsSpeculation", () => {
  beforeEach(() => {
    mocks.getRequestCspNonce.mockResolvedValue("test-nonce");
  });

  it("emits Speculation Rules that prefetch the store catalog path with CSP nonce", async () => {
    const element = await StoreProductsSpeculation();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('type="speculationrules"');
    expect(html).toContain('nonce="test-nonce"');
    expect(html).toContain("/store/products");
    expect(html).toContain('"source":"list"');
    expect(html).toContain('"prefetch"');
  });

  it("omits nonce when the request header is unavailable", async () => {
    mocks.getRequestCspNonce.mockResolvedValue(null);

    const element = await StoreProductsSpeculation();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('type="speculationrules"');
    expect(html).not.toContain("nonce=");
    expect(html).toContain("/store/products");
  });
});
