import { describe, expect, it } from "vitest";

import {
  createHelvetyNextConfig,
  createPublicToolNextConfig,
} from "./next.mjs";

describe("createHelvetyNextConfig", () => {
  it("enables Turbopack root and React Compiler without webpack-only cssChunking", () => {
    const config = createHelvetyNextConfig({ appName: "test" });
    expect(config.turbopack?.root).toBeTruthy();
    expect(config.reactCompiler).toBe(true);
    // Next 16.3+ rejects experimental.cssChunking under Turbopack (webpack-only).
    expect(config.experimental?.cssChunking).toBeUndefined();
  });
});

describe("zone next config presets", () => {
  it("createPublicToolNextConfig sets basePath without assetPrefix", () => {
    const config = createPublicToolNextConfig({ appName: "pdf" });
    expect(config.basePath).toBe("/pdf");
    expect(config.assetPrefix).toBeUndefined();
  });

  it("createPublicToolNextConfig wires zone CSP reporting headers", async () => {
    process.env.NODE_ENV = "development";
    const config = createPublicToolNextConfig({ appName: "pdf" });
    const headerGroups = await config.headers();
    const headers = headerGroups[0]?.headers ?? [];
    const reporting = headers.find(
      (entry) => entry.key === "Reporting-Endpoints"
    );

    expect(reporting?.value).toBe('csp="/pdf/api/csp-report"');
  });
});
