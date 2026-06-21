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

  it("README documents device-trust mint verification and logout clearing trust", () => {
    expect(readme).toContain("mintAndVerifyDeviceTrustCookie");
    expect(readme).toContain("deviceTrustMinted");
    expect(readme).toMatch(/encode\/decode verification/i);
    expect(readme).toMatch(/encode\/decode check is enough/i);
    expect(readme).not.toMatch(/mint\/read-back/i);
    expect(readme).toMatch(/Manual logout clears the trust cookie/i);
    expect(readme).not.toMatch(/passkey-first after sign-out/i);
  });

  it("README documents extension signed weekly proof (no device-trust cookie)", () => {
    expect(readme).toContain("weekly_proof");
    expect(readme).toContain("X-Helvety-Weekly-Proof");
    expect(readme).toMatch(/does not.*HttpOnly device-trust cookie/i);
    expect(readme).toContain("resolveVerifiedExtensionSession");
    expect(readme).toContain("authenticateBearerRequest");
  });

  it("README documents post-OTP bootstrap spinner guard", () => {
    expect(readme).toContain("shouldShowLoginBootstrapSpinner");
  });

  it("README documents post-OTP URL sync and trusted-only passkey canonical redirect", () => {
    expect(readme).toContain("syncLoginUrlStep");
    expect(readme).toContain("shouldCanonicalizeTrustedPasskeyLoginUrl");
    expect(readme).toMatch(/trusted devices without a session/i);
    expect(readme).toMatch(/post-OTP sessions keep client state/i);
  });

  it("hook comments match mobile-only auto-start implementation", () => {
    expect(hookSource).toContain("!isMobile");
    expect(hookSource).toMatch(/user gesture/i);
    expect(hookSource).toContain('runPasskeySignIn("auto")');
    expect(hookSource).toContain('runPasskeySignIn("user")');
  });
});
