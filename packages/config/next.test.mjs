import { describe, expect, it } from "vitest";

import { createHelvetyNextConfig } from "./next.mjs";

describe("createHelvetyNextConfig", () => {
  it("enables strict cssChunking for all Helvety apps", () => {
    const config = createHelvetyNextConfig({ appName: "test" });
    expect(config.experimental?.cssChunking).toBe("strict");
  });
});
