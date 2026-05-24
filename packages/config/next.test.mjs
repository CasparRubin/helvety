import { describe, expect, it } from "vitest";

import {
  createAuthGatewayNextConfig,
  createE2eeZoneNextConfig,
  createHelvetyNextConfig,
  createPublicToolNextConfig,
} from "./next.mjs";

describe("createHelvetyNextConfig", () => {
  it("enables strict cssChunking for all Helvety apps", () => {
    const config = createHelvetyNextConfig({ appName: "test" });
    expect(config.experimental?.cssChunking).toBe("strict");
  });
});

describe("zone next config presets", () => {
  it("createE2eeZoneNextConfig sets basePath and assetPrefix", () => {
    const config = createE2eeZoneNextConfig({ appName: "contacts" });
    expect(config.basePath).toBe("/contacts");
    expect(config.assetPrefix).toBe("/contacts-static");
  });

  it("createPublicToolNextConfig sets basePath without assetPrefix", () => {
    const config = createPublicToolNextConfig({ appName: "pdf" });
    expect(config.basePath).toBe("/pdf");
    expect(config.assetPrefix).toBeUndefined();
  });

  it("createAuthGatewayNextConfig sets auth static prefix", () => {
    const config = createAuthGatewayNextConfig();
    expect(config.basePath).toBe("/auth");
    expect(config.assetPrefix).toBe("/auth-static");
  });
});
