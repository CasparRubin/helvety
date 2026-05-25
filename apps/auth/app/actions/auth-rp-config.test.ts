import { beforeEach, describe, expect, it, vi } from "vitest";

const ALLOWED_ORIGIN = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

vi.mock("@/lib/env", () => ({
  getValidatedAuthEnv: vi.fn(),
}));

import { getValidatedAuthEnv } from "@/lib/env";

import { getExpectedOrigins, getRpId, RP_NAME } from "./auth-rp-config";

describe("auth-rp-config", () => {
  beforeEach(() => {
    vi.mocked(getValidatedAuthEnv).mockReturnValue({
      HELVETY_CHROME_EXTENSION_ORIGINS: [ALLOWED_ORIGIN],
    } as ReturnType<typeof getValidatedAuthEnv>);
  });

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

  it("adds chrome-extension origin when clientOrigin is on the env allowlist", () => {
    expect(getExpectedOrigins("helvety.com", ALLOWED_ORIGIN)).toEqual([
      "https://helvety.com",
      ALLOWED_ORIGIN,
    ]);
  });

  it("does not add chrome-extension origin when clientOrigin is omitted", () => {
    expect(getExpectedOrigins("helvety.com")).toEqual(["https://helvety.com"]);
  });

  it("does not add disallowed chrome-extension origin", () => {
    expect(
      getExpectedOrigins(
        "helvety.com",
        "chrome-extension://not-on-allowlist000000000000"
      )
    ).toEqual(["https://helvety.com"]);
  });
});
