import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getValidatedAuthEnv: vi.fn(),
}));

import { isAllowedChromeExtensionOrigin } from "@/lib/chrome-extension-origin";
import { getValidatedAuthEnv } from "@/lib/env";

const ALLOWED = "chrome-extension://abcdefghijklmnopqrstuvwxyzabcdef";

describe("isAllowedChromeExtensionOrigin", () => {
  beforeEach(() => {
    vi.mocked(getValidatedAuthEnv).mockReturnValue({
      HELVETY_CHROME_EXTENSION_ORIGINS: [ALLOWED],
    } as ReturnType<typeof getValidatedAuthEnv>);
  });

  it("allows origins on the env allowlist", () => {
    expect(isAllowedChromeExtensionOrigin(ALLOWED)).toBe(true);
  });

  it("rejects unknown extension ids", () => {
    expect(
      isAllowedChromeExtensionOrigin(
        "chrome-extension://not-on-allowlist000000000000"
      )
    ).toBe(false);
  });

  it("rejects https origins", () => {
    expect(isAllowedChromeExtensionOrigin("https://helvety.com")).toBe(false);
  });

  it("rejects malformed chrome-extension URLs", () => {
    expect(isAllowedChromeExtensionOrigin("chrome-extension://")).toBe(false);
  });

  it("returns false when auth env validation fails", () => {
    vi.mocked(getValidatedAuthEnv).mockImplementation(() => {
      throw new Error("Invalid environment variables");
    });
    expect(isAllowedChromeExtensionOrigin(ALLOWED)).toBe(false);
  });
});
