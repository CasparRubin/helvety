import { SECURITY_PROXY_MATCHER } from "@helvety/shared/proxy";
import { describe, expect, it } from "vitest";

import { config } from "./proxy";

describe("auth app proxy config", () => {
  it("matches shared SECURITY_PROXY_MATCHER (Next requires a static literal in proxy.ts)", () => {
    expect(config.matcher).toEqual(SECURITY_PROXY_MATCHER);
  });
});
