import { describe, expect, it } from "vitest";

import { resolveAuthStep } from "./auth-step";

describe("resolveAuthStep", () => {
  it("requires encryption setup when passkey is missing", () => {
    expect(
      resolveAuthStep({
        hasPasskey: false,
        hasEncryption: false,
      })
    ).toBe("encryption-setup");
  });

  it("requires encryption setup when encryption is missing", () => {
    expect(
      resolveAuthStep({
        hasPasskey: true,
        hasEncryption: false,
      })
    ).toBe("encryption-setup");
  });

  it("requires passkey sign-in when passkey and encryption are ready", () => {
    expect(
      resolveAuthStep({
        hasPasskey: true,
        hasEncryption: true,
      })
    ).toBe("passkey-signin");
  });
});
