import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const authRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("auth flow documentation guardrails", () => {
  const readme = readFileSync(join(authRoot, "README.md"), "utf8");
  const hookSource = readFileSync(
    join(authRoot, "hooks/use-login-flow.ts"),
    "utf8"
  );

  it("README documents desktop user-gesture passkey vs mobile auto-start", () => {
    expect(readme).toMatch(/user gesture/i);
    expect(readme).toMatch(/auto-start/i);
    expect(readme).toMatch(/isMobileDevice/i);
    expect(readme).toMatch(/hybrid/i);
    expect(readme).toMatch(/does not auto-start/i);
  });

  it("README documents probe-cache invalidation and error surfacing policy", () => {
    expect(readme).toContain("invalidateAuthUserProbeCache");
    expect(readme).toContain("shouldSurfaceLoginError");
    expect(readme).toContain("login-flow-errors.ts");
  });

  it("README does not reference removed authBootstrapKey remount pattern", () => {
    expect(readme).not.toContain("authBootstrapKey");
  });

  it("README documents device-trust mint/read-back and logout clearing trust", () => {
    expect(readme).toContain("mintAndVerifyDeviceTrustCookie");
    expect(readme).toContain("deviceTrustMinted");
    expect(readme).toMatch(/Manual logout clears the trust cookie/i);
    expect(readme).not.toMatch(/passkey-first after sign-out/i);
  });

  it("README documents extension weekly OTP anchor (no device-trust cookie)", () => {
    expect(readme).toContain("helvety_extension_last_email_verified");
    expect(readme).toMatch(/does not.*mint.*helvety_device_trust/i);
    expect(readme).toContain("resolveVerifiedExtensionSession");
    expect(readme).toMatch(/OTP anchor|jwt-session-lifetime/i);
  });

  it("README documents post-OTP bootstrap spinner guard", () => {
    expect(readme).toContain("shouldShowLoginBootstrapSpinner");
  });

  it("hook comments match mobile-only auto-start implementation", () => {
    expect(hookSource).toContain("!isMobile");
    expect(hookSource).toMatch(/user gesture/i);
    expect(hookSource).toContain('runPasskeySignIn("auto")');
    expect(hookSource).toContain('runPasskeySignIn("user")');
  });
});
