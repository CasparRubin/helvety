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

describe("gateway home page", () => {
  it("mounts store catalog Speculation Rules next to the marketing hero", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("StoreProductsSpeculation");
    expect(source).toContain("HeroMarketingShell");
  });
});

describe("StoreProductsSpeculation wiring", () => {
  it("loads the request CSP nonce for speculationrules script-src", () => {
    const source = readFileSync(speculationPath, "utf8");

    expect(source).toContain("getRequestCspNonce");
    expect(source).toContain('type="speculationrules"');
    expect(source).toContain("urls.storeProducts");
    expect(source).toContain("nonce={nonce}");
  });
});
