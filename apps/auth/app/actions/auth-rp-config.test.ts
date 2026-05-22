import { describe, expect, it } from "vitest";

import { getExpectedOrigins, getRpId, RP_NAME } from "./auth-rp-config";

describe("auth-rp-config", () => {
  it("exports the canonical RP name", () => {
    expect(RP_NAME).toBe("Helvety");
  });

  it("uses localhost rpId for local origins", () => {
    expect(getRpId("http://localhost:3001")).toBe("localhost");
    expect(getRpId("http://127.0.0.1:3002")).toBe("localhost");
  });

  it("uses root domain rpId for non-local origins and malformed input", () => {
    expect(getRpId("https://helvety.com/auth")).toBe("helvety.com");
    expect(getRpId("not-a-url")).toBe("helvety.com");
  });

  it("returns all dev origins for localhost rpId", () => {
    const origins = getExpectedOrigins("localhost");

    expect(origins).toContain("http://localhost:3001");
    expect(origins).toContain("http://127.0.0.1:3008");
  });

  it("returns production root origin for domain rpId", () => {
    expect(getExpectedOrigins("helvety.com")).toEqual(["https://helvety.com"]);
  });

  it("adds chrome-extension origin when clientOrigin is an extension URL", () => {
    const extensionOrigin =
      "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";
    expect(getExpectedOrigins("helvety.com", extensionOrigin)).toEqual([
      "https://helvety.com",
      extensionOrigin,
    ]);
  });

  it("does not add chrome-extension origin when clientOrigin is omitted", () => {
    expect(getExpectedOrigins("helvety.com")).toEqual(["https://helvety.com"]);
  });
});
