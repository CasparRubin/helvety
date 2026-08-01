import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequestCspNonce: vi.fn(),
  clientProps: vi.fn(),
}));

vi.mock("@helvety/shared/csp-nonce", () => ({
  getRequestCspNonce: mocks.getRequestCspNonce,
}));

vi.mock("./store-products-speculation-client", () => ({
  StoreProductsSpeculationClient: (props: {
    rulesJson: string;
    nonce?: string;
  }) => {
    mocks.clientProps(props);
    return null;
  },
}));

import { StoreProductsSpeculation } from "./store-products-speculation";

describe("StoreProductsSpeculation", () => {
  beforeEach(() => {
    mocks.getRequestCspNonce.mockResolvedValue("test-nonce");
    mocks.clientProps.mockClear();
  });

  it("passes Speculation Rules JSON and CSP nonce to the client injector", async () => {
    const element = await StoreProductsSpeculation();
    renderToStaticMarkup(element);

    expect(mocks.clientProps).toHaveBeenCalledTimes(1);
    const props = mocks.clientProps.mock.calls[0]?.[0] as {
      rulesJson: string;
      nonce?: string;
    };
    expect(props.nonce).toBe("test-nonce");
    expect(props.rulesJson).toContain("/store/products");
    expect(props.rulesJson).toContain('"source":"list"');
    expect(props.rulesJson).toContain('"prefetch"');
  });

  it("omits nonce when the request header is unavailable", async () => {
    mocks.getRequestCspNonce.mockResolvedValue(null);

    const element = await StoreProductsSpeculation();
    renderToStaticMarkup(element);

    const props = mocks.clientProps.mock.calls[0]?.[0] as {
      rulesJson: string;
      nonce?: string;
    };
    expect(props.nonce).toBeUndefined();
    expect(props.rulesJson).toContain("/store/products");
  });
});
