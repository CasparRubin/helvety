import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const routePath = join(dirname(fileURLToPath(import.meta.url)), "route.ts");

describe("auth callback route", () => {
  it("exports GET from createAuthCallbackHandler with a restricted OTP allowlist", () => {
    const src = readFileSync(routePath, "utf8");

    expect(src).toContain("createAuthCallbackHandler");
    expect(src).toContain("allowedOtpTypes: ALLOWED_OTP_TYPES");
    expect(src).toMatch(/"magiclink"/);
    expect(src).toMatch(/"email_change"/);
    expect(src).not.toMatch(/"email",/);
  });

  it("re-exports a nodejs runtime handler", async () => {
    const route = await import("./route");
    expect(route.runtime).toBe("nodejs");
    expect(typeof route.GET).toBe("function");
  });

  it("mints device trust after successful email verification", () => {
    const src = readFileSync(routePath, "utf8");

    expect(src).toContain("setDeviceTrustCookie");
    expect(src).toMatch(/onAuthSuccessRedirect[\s\S]*setDeviceTrustCookie/);
  });

  it("builds login redirects via buildAuthLoginUrl", () => {
    const src = readFileSync(routePath, "utf8");

    expect(src).toContain("buildAuthLoginUrl");
    expect(src).not.toContain("new URL(`${authBase}/login`)");
  });
});
