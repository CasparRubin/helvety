vi.mock("@helvety/shared/auth-errors", () => ({
  classifyActionAuthError: vi.fn().mockReturnValue("none"),
}));

vi.mock("@helvety/shared/auth-redirect", () => ({
  getLoginUrl: vi.fn(
    (target?: string, options?: { forceLogin?: boolean }) =>
      `https://helvety.com/auth/login?redirect_uri=${encodeURIComponent(target ?? "")}${options?.forceLogin ? "&force_login=1" : ""}`
  ),
}));

vi.mock("./hard-logout", () => ({
  forceHardLogout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { classifyActionAuthError } from "@helvety/shared/auth-errors";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getE2eeHookErrorMessage,
  guardE2eeMasterKey,
  redirectToLoginOnce,
  reportE2eeActionFailure,
  reportE2eeHookError,
  resetGlobalRedirectLockForTests,
  triggerHardLogoutOnce,
} from "./auth-navigation";
import { forceHardLogout } from "./hard-logout";

beforeEach(() => {
  resetGlobalRedirectLockForTests();
  vi.stubGlobal("window", {
    location: { href: "https://helvety.com/tasks", replace: vi.fn() },
    dispatchEvent: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("global redirect lock", () => {
  it("allows the first login redirect", () => {
    const result = redirectToLoginOnce("https://helvety.com/tasks", "test");
    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledTimes(1);
  });

  it("blocks a second login redirect after the first", () => {
    redirectToLoginOnce("https://helvety.com/tasks", "first");
    const result = redirectToLoginOnce("https://helvety.com/notes", "second");
    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledTimes(1);
  });

  it("blocks a hard logout after a login redirect", () => {
    redirectToLoginOnce("https://helvety.com/tasks", "login");
    const result = triggerHardLogoutOnce("https://helvety.com/tasks", "gate");
    expect(result).toBe(true);
    // Only the login redirect's window.location.replace should have fired
    expect(window.location.replace).toHaveBeenCalledTimes(1);
  });

  it("blocks a login redirect after a hard logout", () => {
    triggerHardLogoutOnce("https://helvety.com/tasks", "gate");
    const result = redirectToLoginOnce("https://helvety.com/tasks", "recovery");
    expect(result).toBe(true);
    // login redirect should NOT have called replace
    expect(window.location.replace).toHaveBeenCalledTimes(0);
  });

  it("allows redirect after reset (test utility)", () => {
    redirectToLoginOnce("https://helvety.com/tasks", "first");
    expect(window.location.replace).toHaveBeenCalledTimes(1);

    resetGlobalRedirectLockForTests();
    redirectToLoginOnce("https://helvety.com/notes", "second");
    expect(window.location.replace).toHaveBeenCalledTimes(2);
  });

  it("returns false when expected route is stale and emits a deduped event", () => {
    const result = redirectToLoginOnce("https://helvety.com/tasks", "stale", {
      expectedRoute: "https://helvety.com/notes",
      requestStartedAt: Date.now() - 100,
    });

    expect(result).toBe(false);
    expect(window.location.replace).not.toHaveBeenCalled();
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "helvety:auth-navigation",
        detail: expect.objectContaining({
          deduped: true,
          routeMatched: false,
          source: "stale",
          type: "login",
        }),
      })
    );
  });

  it("passes forceLogin through login URL generation", () => {
    const result = redirectToLoginOnce("https://helvety.com/tasks", "force", {
      forceLogin: true,
    });

    expect(result).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith(
      expect.stringContaining("force_login=1")
    );
  });
});

describe("guardE2eeMasterKey", () => {
  beforeEach(() => {
    vi.mocked(forceHardLogout).mockClear();
  });

  it("returns false without hard logout when vault is locked", () => {
    const result = guardE2eeMasterKey(null, false, "test-guard");
    expect(result).toBe(false);
    expect(forceHardLogout).not.toHaveBeenCalled();
  });

  it("triggers hard logout when unlocked in context but master key is missing", () => {
    const result = guardE2eeMasterKey(null, true, "test-guard-stale");
    expect(result).toBe(false);
    expect(forceHardLogout).toHaveBeenCalledTimes(1);
    expect(forceHardLogout).toHaveBeenCalledWith("https://helvety.com/tasks");
  });

  it("returns true when master key is present", () => {
    const key = {} as CryptoKey;
    expect(guardE2eeMasterKey(key, true, "test-guard-ok")).toBe(true);
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});

describe("E2EE hook error helpers", () => {
  beforeEach(() => {
    resetGlobalRedirectLockForTests();
    vi.mocked(classifyActionAuthError).mockReturnValue("none");
    vi.mocked(toast.error).mockClear();
  });

  it("getE2eeHookErrorMessage prefers Error.message", () => {
    expect(getE2eeHookErrorMessage(new Error("boom"), "fallback")).toBe("boom");
    expect(getE2eeHookErrorMessage("plain", "fallback")).toBe("fallback");
  });

  it("reportE2eeHookError toasts when auth navigation does not apply", () => {
    const setError = vi.fn();
    const consumed = reportE2eeHookError(new Error("load failed"), {
      source: "tasks-use-items",
      fallback: "Failed to load",
      setError,
    });

    expect(consumed).toBe(false);
    expect(setError).toHaveBeenCalledWith("load failed");
    expect(toast.error).toHaveBeenCalledWith("load failed", {
      duration: expect.any(Number),
    });
  });

  it("reportE2eeHookError skips toast when login redirect is triggered", () => {
    vi.mocked(classifyActionAuthError).mockReturnValue("login");
    const setError = vi.fn();

    const consumed = reportE2eeHookError(new Error("session expired"), {
      source: "notes-use-items",
      fallback: "Failed",
      setError,
    });

    expect(consumed).toBe(true);
    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(window.location.replace).toHaveBeenCalledTimes(1);
    vi.mocked(classifyActionAuthError).mockReturnValue("none");
  });

  it("reportE2eeActionFailure uses fallback when error is empty", () => {
    const consumed = reportE2eeActionFailure(null, {
      source: "contacts-use-contacts",
      fallback: "Failed to save",
    });

    expect(consumed).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to save", {
      duration: expect.any(Number),
    });
  });
});
