import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import {
  buildAuthLoginPath,
  buildAuthLoginUrl,
  resolveLoginEntryStep,
} from "./login-entry";

const TRUSTED_USER = "550e8400-e29b-41d4-a716-446655440000";
const REDIRECT = "https://helvety.com/tasks";

/**
 *
 */
function baseInput(
  overrides: Partial<Parameters<typeof resolveLoginEntryStep>[0]> = {}
) {
  return {
    urlStep: null,
    hasSession: false,
    trust: { trusted: false, userId: null },
    forceLogin: false,
    requiredAuthStep: null,
    redirectUri: REDIRECT,
    ...overrides,
  };
}

describe("resolveLoginEntryStep", () => {
  it("redirects when session is complete and force_login is absent", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({ hasSession: true, redirectUri: REDIRECT })
      )
    ).toEqual({
      kind: "redirect",
      redirectTo: REDIRECT,
    });
  });

  it("does not redirect when session exists but force_login is set", () => {
    const result = resolveLoginEntryStep(
      baseInput({
        hasSession: true,
        forceLogin: true,
        requiredAuthStep: "passkey-signin",
      })
    );
    expect(result).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: null,
    });
  });

  it("trusted device without session goes to passkey-signin", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          trust: { trusted: true, userId: TRUSTED_USER },
        })
      )
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: TRUSTED_USER,
    });
  });

  it("trusted device with force_login still skips email", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          trust: { trusted: true, userId: TRUSTED_USER },
          forceLogin: true,
        })
      )
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: TRUSTED_USER,
    });
  });

  it("untrusted entry defaults to email", () => {
    expect(resolveLoginEntryStep(baseInput())).toEqual({
      kind: "step",
      step: "email",
      trustedUserId: null,
    });
  });

  it("explicit step=email is respected even when trusted", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          urlStep: "email",
          trust: { trusted: true, userId: TRUSTED_USER },
        })
      )
    ).toEqual({
      kind: "step",
      step: "email",
      trustedUserId: null,
    });
  });

  it("passkey-signin without trust falls back to email", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          urlStep: "passkey-signin",
        })
      )
    ).toEqual({
      kind: "step",
      step: "email",
      trustedUserId: null,
    });
  });

  it("explicit passkey-signin with trust keeps passkey and trustedUserId", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          urlStep: "passkey-signin",
          trust: { trusted: true, userId: TRUSTED_USER },
        })
      )
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: TRUSTED_USER,
    });
  });

  it("session with incomplete auth routes via requiredAuthStep", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          hasSession: true,
          requiredAuthStep: "encryption-setup",
        })
      )
    ).toEqual({
      kind: "step",
      step: "encryption-setup",
      trustedUserId: null,
    });
  });

  it("encryption-setup without session falls back to email", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          urlStep: "encryption-setup",
        })
      )
    ).toEqual({
      kind: "step",
      step: "email",
      trustedUserId: null,
    });
  });

  it("cannot redirect without a session", () => {
    const result = resolveLoginEntryStep(baseInput());
    expect(result.kind).toBe("step");
  });

  it("session with force_login and complete auth stays on passkey-signin", () => {
    expect(
      resolveLoginEntryStep(
        baseInput({
          hasSession: true,
          forceLogin: true,
          requiredAuthStep: null,
        })
      )
    ).toEqual({
      kind: "step",
      step: "passkey-signin",
      trustedUserId: null,
    });
  });
});

describe("buildAuthLoginPath", () => {
  it("includes step and force_login when provided", () => {
    const path = buildAuthLoginPath({
      redirectUri: "https://helvety.com/tasks",
      forceLogin: true,
      step: "passkey-signin",
      error: "auth_failed",
    });
    expect(path).toContain("redirect_uri=");
    expect(path).toContain("force_login=1");
    expect(path).toContain("step=passkey-signin");
    expect(path).toContain("error=auth_failed");
  });

  it("omits step when not provided (resolver adds it at login gate)", () => {
    const path = buildAuthLoginPath({
      redirectUri: "https://helvety.com/tasks",
    });
    expect(path).toMatch(/^\/login\?/);
    expect(path).not.toContain("step=");
  });
});

describe("buildAuthLoginUrl", () => {
  it("prefixes auth zone base URL", () => {
    expect(
      buildAuthLoginUrl({
        redirectUri: "https://helvety.com/tasks",
        step: "passkey-signin",
      })
    ).toBe(
      `${urls.auth}${buildAuthLoginPath({
        redirectUri: "https://helvety.com/tasks",
        step: "passkey-signin",
      })}`
    );
  });
});
