import { SECURITY_PROXY_MATCHER } from "@helvety/shared/proxy";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("store app proxy config", () => {
  it("matches shared SECURITY_PROXY_MATCHER (Next requires a static literal in proxy.ts)", () => {
    expect(config.matcher).toEqual(SECURITY_PROXY_MATCHER);
  });

  it("returns a 404 rewrite for unknown product slugs", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3002/store/products/missing-product")
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toContain(
      "/store/products/not-found"
    );
  });

  it("passes through known product slugs and non-product routes", async () => {
    const productResponse = await proxy(
      new NextRequest("http://localhost:3002/store/products/helvety-pdf")
    );
    expect(productResponse.status).toBe(200);

    const catalogResponse = await proxy(
      new NextRequest("http://localhost:3002/store/products")
    );
    expect(catalogResponse.status).toBe(200);
  });
});
