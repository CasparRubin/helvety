import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { syncLoginUrlStep } from "./login-url-sync";

/** Minimal `window` stub for `syncLoginUrlStep` tests. */
function createMockWindow(search = ""): Window & typeof globalThis {
  const replaceState = vi.fn();
  const win = {
    location: {
      origin: "https://helvety.com",
      pathname: "/auth/login",
      search,
    },
    history: {
      state: { idx: 0 },
      replaceState,
    },
  };
  return win as unknown as Window & typeof globalThis;
}

describe("syncLoginUrlStep", () => {
  let replaceState: ReturnType<typeof vi.fn>;
  let originalWindow: (Window & typeof globalThis) | undefined;

  beforeEach(() => {
    originalWindow = globalThis.window;
    const mockWindow = createMockWindow(
      "?redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks"
    );
    replaceState = (
      mockWindow.history as unknown as {
        replaceState: ReturnType<typeof vi.fn>;
      }
    ).replaceState;
    globalThis.window = mockWindow;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
  });

  it("updates the URL with step and preserves redirect_uri via replaceState", () => {
    syncLoginUrlStep("passkey-signin", {
      redirectUri: "https://helvety.com/tasks",
      forceLogin: false,
    });

    expect(replaceState).toHaveBeenCalledTimes(1);
    const nextUrl = replaceState.mock.calls[0]?.[2] as string;
    expect(nextUrl).toBe(
      "/auth/login?redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks&step=passkey-signin"
    );
  });

  it("includes force_login when requested", () => {
    globalThis.window = createMockWindow("");
    replaceState = (
      globalThis.window.history as unknown as {
        replaceState: ReturnType<typeof vi.fn>;
      }
    ).replaceState;

    syncLoginUrlStep("encryption-setup", {
      redirectUri: "https://helvety.com/tasks",
      forceLogin: true,
    });

    const nextUrl = replaceState.mock.calls[0]?.[2] as string;
    expect(nextUrl).toBe(
      "/auth/login?redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks&force_login=1&step=encryption-setup"
    );
  });

  it("includes error query param when provided", () => {
    syncLoginUrlStep("passkey-signin", {
      redirectUri: "https://helvety.com/tasks",
      forceLogin: false,
      error: "auth_failed",
    });

    const nextUrl = replaceState.mock.calls[0]?.[2] as string;
    expect(nextUrl).toContain("error=auth_failed");
    expect(nextUrl).toContain("step=passkey-signin");
  });

  it("no-ops when window is undefined", () => {
    const saved = globalThis.window;
    Reflect.deleteProperty(globalThis, "window");

    expect(() =>
      syncLoginUrlStep("passkey-signin", {
        redirectUri: null,
        forceLogin: false,
      })
    ).not.toThrow();

    globalThis.window = saved;
  });
});
