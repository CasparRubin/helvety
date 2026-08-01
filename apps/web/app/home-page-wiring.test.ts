import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDir = dirname(fileURLToPath(import.meta.url));
const pagePath = join(appDir, "page.tsx");
const speculationPath = join(
  appDir,
  "../components/store-products-speculation.tsx"
);
const speculationClientPath = join(
  appDir,
  "../components/store-products-speculation-client.tsx"
);

describe("gateway home page", () => {
  it("server-renders the marketing shell with store Speculation Rules", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("HeroMarketingShell");
    expect(source).toContain("StoreProductsSpeculation");
    expect(source).toMatch(/plain theme background/i);
    expect(source).not.toContain("HeroSection");
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/Hyperspeed|SideRays|light-pillar|WebGL/i);
  });
});

describe("StoreProductsSpeculation wiring", () => {
  it("builds rules with CSP nonce and injects via the DOM client", () => {
    const server = readFileSync(speculationPath, "utf8");
    const client = readFileSync(speculationClientPath, "utf8");

    expect(server).toContain("getRequestCspNonce");
    expect(server).toContain("urls.storeProducts");
    expect(server).toContain("StoreProductsSpeculationClient");
    expect(client).toContain("document.createElement");
    expect(client).toContain('type = "speculationrules"');
  });
});
