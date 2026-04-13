import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@helvety/shared/auth-errors", () => ({
  classifyActionAuthError: vi.fn().mockReturnValue("none"),
}));

vi.mock("@helvety/shared/auth-redirect", () => ({
  getLoginUrl: vi.fn(
    (target?: string) =>
      `https://helvety.com/auth/login?redirect_uri=${encodeURIComponent(target ?? "")}`
  ),
}));

vi.mock("./hard-logout", () => ({
  forceHardLogout: vi.fn().mockResolvedValue(undefined),
}));

import {
  redirectToLoginOnce,
  resetGlobalRedirectLockForTests,
  triggerHardLogoutOnce,
} from "./auth-navigation";

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
});
