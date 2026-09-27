import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDir = dirname(fileURLToPath(import.meta.url));
const pagePath = join(appDir, "page.tsx");
const speculationRulesPath = join(
  appDir,
  "../public/speculation/store-products.json"
);

describe("gateway home page", () => {
  it("server-renders the marketing shell without a client speculation injector", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("HeroMarketingShell");
    expect(source).not.toContain("StoreProductsSpeculation");
    expect(source).toMatch(/plain theme background/i);
    expect(source).toMatch(/Speculation-Rules/);
    expect(source).not.toContain("HeroSection");
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/Hyperspeed|SideRays|light-pillar|WebGL/i);
  });
});

describe("store catalog speculation rules", () => {
  it("eager-prerenders only the store catalog", () => {
    const rules = JSON.parse(readFileSync(speculationRulesPath, "utf8")) as {
      prefetch?: unknown;
      prerender?: unknown;
    };

    expect(rules.prefetch).toBeUndefined();
    expect(rules.prerender).toEqual([
      {
        source: "list",
        urls: ["/store/products"],
        eagerness: "eager",
      },
    ]);
    expect(JSON.stringify(rules)).not.toMatch(/\/pdf|\/ocr|\/image-editor/);
  });
});
