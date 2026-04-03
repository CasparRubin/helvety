import { describe, expect, it } from "vitest";

import { resolveAuthenticatedEmailBootstrap } from "./login-email-bootstrap";

describe("login-email-bootstrap", () => {
  const home = "https://helvety.com";

  it("always continues to encryption-setup when passkey or encryption is missing", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "encryption-setup",
        forceLogin: false,
        redirectUri: null,
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "encryption-setup" });

    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "encryption-setup",
        forceLogin: true,
        redirectUri: "https://helvety.com/tasks",
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "encryption-setup" });
  });

  it("redirects when passkey sign-in would be next and force_login is off for non-E2EE targets", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: false,
        redirectUri: null,
        homeUrl: home,
      })
    ).toEqual({ kind: "redirect", href: home });

    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: false,
        redirectUri: "https://helvety.com/store",
        homeUrl: home,
      })
    ).toEqual({ kind: "redirect", href: "https://helvety.com/store" });
  });

  it("requires passkey sign-in for E2EE app redirect URIs when force_login is off", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: false,
        redirectUri: "https://helvety.com/tasks",
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "passkey-signin" });

    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: false,
        redirectUri: "https://helvety.com/notes",
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "passkey-signin" });

    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: false,
        redirectUri: "https://helvety.com/contacts",
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "passkey-signin" });
  });

  it("shows passkey sign-in when force_login is set", () => {
    expect(
      resolveAuthenticatedEmailBootstrap({
        requiredStep: "passkey-signin",
        forceLogin: true,
        redirectUri: null,
        homeUrl: home,
      })
    ).toEqual({ kind: "set_step", step: "passkey-signin" });
  });
});
