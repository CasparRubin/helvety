import { describe, expect, it } from "vitest";

import { resolveAuthStep } from "./route";

describe("resolveAuthStep", () => {
  it("requires encryption setup for users without a passkey", () => {
    expect(
      resolveAuthStep({
        hasPasskey: false,
        hasEncryption: false,
      })
    ).toBe("encryption-setup");
  });

  it("requires encryption setup when passkey exists but encryption is missing", () => {
    expect(
      resolveAuthStep({
        hasPasskey: true,
        hasEncryption: false,
      })
    ).toBe("encryption-setup");
  });

  it("goes to passkey sign-in when passkey and encryption are ready", () => {
    expect(
      resolveAuthStep({
        hasPasskey: true,
        hasEncryption: true,
      })
    ).toBe("passkey-signin");
  });
});
