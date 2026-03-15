import { afterEach, describe, expect, it, vi } from "vitest";

import { getLoginUrl, getLogoutUrl } from "./auth-redirect";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLoginUrl", () => {
  it("keeps valid absolute redirect_uri", () => {
    const url = getLoginUrl("https://helvety.com/tasks");
    expect(url).toContain("redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks");
  });

  it("builds absolute redirect from relative path and current origin", () => {
    const url = getLoginUrl("/notes", {
      currentOrigin: "http://localhost:3007",
    });
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3007%2Fnotes");
  });

  it("preserves query and hash from source URLs", () => {
    const source = "https://helvety.com/tasks?filter=today#item-7";
    const url = getLoginUrl(source);
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fhelvety.com%2Ftasks%3Ffilter%3Dtoday%23item-7"
    );
  });

  it("unwraps existing auth login URLs instead of nesting redirect_uri", () => {
    const source =
      "https://helvety.com/auth/login?redirect_uri=https%3A%2F%2Fhelvety.com%2Fnotes";
    const url = getLoginUrl(source);

    expect(url).toContain("redirect_uri=https%3A%2F%2Fhelvety.com%2Fnotes");
    expect(url).not.toContain(
      "redirect_uri=https%3A%2F%2Fhelvety.com%2Fauth%2Flogin"
    );
  });

  it("falls back safely when auth login redirect_uri is invalid", () => {
    const source =
      "https://helvety.com/auth/login?redirect_uri=https%3A%2F%2Fevil.example";
    const url = getLoginUrl(source);
    const parsed = new URL(url);
    const redirectUri = parsed.searchParams.get("redirect_uri");

    expect(redirectUri).toBeTruthy();
    expect(redirectUri).not.toContain("/auth/login");
    expect(url).not.toContain("evil.example");
  });

  it("preserves force_login while unwrapping auth login URLs", () => {
    const source =
      "https://helvety.com/auth/login?redirect_uri=https%3A%2F%2Fhelvety.com%2Fnotes";
    const url = getLoginUrl(source, { forceLogin: true });

    expect(url).toContain("redirect_uri=https%3A%2F%2Fhelvety.com%2Fnotes");
    expect(url).toContain("force_login=1");
  });
});

describe("getLogoutUrl", () => {
  it("builds relative redirect against provided current origin", () => {
    const url = getLogoutUrl("/contacts", {
      global: true,
      currentOrigin: "http://127.0.0.1:3006",
    });

    expect(url).toContain(
      "redirect_uri=http%3A%2F%2F127.0.0.1%3A3006%2Fcontacts"
    );
    expect(url).toContain("scope=global");
  });

  it("falls back to window location when available", () => {
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:3001/store",
        origin: "http://localhost:3001",
      },
    });

    const url = getLogoutUrl("https://invalid.example");
    expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fstore");
  });
});
