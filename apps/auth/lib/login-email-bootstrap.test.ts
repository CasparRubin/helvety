import { describe, expect, it } from "vitest";

import { resolveAuthenticatedEmailBootstrap } from "./login-email-bootstrap";

describe("login-email-bootstrap", () => {
  it("returns encryption-setup when setup is required", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "encryption-setup",
      })
    ).toEqual({ kind: "set_step", step: "encryption-setup" });
  });

  it("returns passkey-signin when sign-in is required", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
      })
    ).toEqual({ kind: "set_step", step: "passkey-signin" });
  });

  it("always returns explicit set_step actions", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "encryption-setup",
      })
    ).toMatchObject({ kind: "set_step" });
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
      })
    ).toMatchObject({ kind: "set_step" });
  });
});
