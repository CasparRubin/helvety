import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetCookieSigningKeyCache,
  signCookiePayload,
} from "./cookie-signing";
import {
  CSRF_BOOTSTRAP_HEADER_NAME,
  SECURITY_PROXY_MATCHER,
  SECURITY_PROXY_PROFILE_OPTIONS,
  createAppProxy,
  createSecurityProxy,
  redirectRootToBasePath,
} from "./proxy";

import type { NextRequest as NextRequestType } from "next/server";

const ORIGINAL_ENV = { ...process.env };

vi.mock("./supabase/refresh-auth-session-in-proxy", () => ({
  requestMayHaveSupabaseAuthCookie: () => false,
  refreshSupabaseAuthSession: async (
    _request: NextRequest,
    response: NextResponse
  ) => response,
}));

/** Creates a minimal request-shaped object for proxy utility tests. */
function makeRequest(
  url: string,
  pathname: string,
  basePath = ""
): NextRequestType {
  return {
    url,
    nextUrl: {
      pathname,
      basePath,
      origin: "https://helvety.com",
      search: "",
    },
    cookies: {
      get: () => undefined,
    },
    headers: new Headers(),
  } as unknown as NextRequestType;
}

describe("proxy shared abstractions", () => {
  it("exposes the shared security matcher baseline", () => {
    expect(SECURITY_PROXY_MATCHER).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|json|map|woff2?|mjs|wasm)$).*)",
    ]);
  });

  it("keeps key matcher exclusions encoded in the shared baseline", () => {
    const matcherPattern = SECURITY_PROXY_MATCHER[0];
    expect(matcherPattern).toBeDefined();
    if (!matcherPattern) {
      throw new Error("SECURITY_PROXY_MATCHER must contain one entry");
    }

    expect(matcherPattern).toContain("_next/static");
    expect(matcherPattern).toContain("_next/image");
    expect(matcherPattern).toContain("favicon.ico");
    expect(matcherPattern).toContain("webp");
    expect(matcherPattern).toContain("woff2?");
    expect(matcherPattern).toContain("json");
    expect(matcherPattern).toContain("mjs");
    expect(matcherPattern).toContain("wasm");
  });

  it("defines canonical profile defaults", () => {
    expect(SECURITY_PROXY_PROFILE_OPTIONS["e2ee-app"]).toMatchObject({
      includeHelvetyUrl: true,
      includeCsrf: true,
      buildCspOptions: { imgBlob: true },
    });
    expect(SECURITY_PROXY_PROFILE_OPTIONS["public-marketing"]).toMatchObject({
      includeHelvetyUrl: false,
      includeCsrf: false,
    });
  });

  it("redirectRootToBasePath redirects root and skips non-root", () => {
    const rootRequest = makeRequest("https://helvety.com/", "/", "/auth");
    const childRequest = makeRequest(
      "https://helvety.com/auth/login",
      "/auth/login",
      "/auth"
    );

    const rootResult = redirectRootToBasePath(rootRequest, "/auth");
    const childResult = redirectRootToBasePath(childRequest, "/auth");

    expect(rootResult?.headers.get("location")).toBe(
      "https://helvety.com/auth"
    );
    expect(childResult).toBeNull();
  });

  it("createAppProxy redirects root to basePath without calling security proxy (auth refresh covered separately)", async () => {
    const securityProxy = vi.fn(async () =>
      NextResponse.redirect("https://helvety.com/security")
    );
    const proxy = createAppProxy({
      securityProxy,
      defaultBasePath: "/notes",
    });

    const rootResponse = await proxy(makeRequest("https://helvety.com/", "/"));
    const normalResponse = await proxy(
      makeRequest("https://helvety.com/notes/current", "/notes/current")
    );

    expect(rootResponse.headers.get("location")).toBe(
      "https://helvety.com/notes"
    );
    expect(normalResponse.headers.get("location")).toBe(
      "https://helvety.com/security"
    );
    expect(securityProxy).toHaveBeenCalledTimes(1);
  });
});

describe("createSecurityProxy CSRF bootstrap", () => {
  beforeEach(() => {
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test_cookie_signing_secret_for_proxy_csrf_tests_12";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetCookieSigningKeyCache();
  });

  it("re-bootstraps when an existing CSRF cookie was signed with a previous secret", async () => {
    const token = "b".repeat(64);
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "previous_cookie_signing_secret_for_proxy_tests_1";
    const staleCookie = await signCookiePayload(token);

    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test_cookie_signing_secret_for_proxy_csrf_tests_12";
    resetCookieSigningKeyCache();

    const nextSpy = vi.spyOn(NextResponse, "next");
    const proxy = createSecurityProxy();
    const request = new NextRequest("https://helvety.com/auth/login", {
      headers: { cookie: `csrf_token=${staleCookie}` },
    });

    const response = await proxy(request);

    const refreshedCookie = response.cookies.get("csrf_token")?.value;
    expect(refreshedCookie).toBeDefined();
    expect(refreshedCookie).not.toBe(staleCookie);

    const forwardedHeaders = nextSpy.mock.calls[0]?.[0]?.request?.headers;
    expect(forwardedHeaders?.get(CSRF_BOOTSTRAP_HEADER_NAME)).toMatch(
      /^[0-9a-f]{64}$/i
    );

    nextSpy.mockRestore();
  });

  it("re-bootstraps when an existing CSRF cookie is present but malformed", async () => {
    const proxy = createSecurityProxy();
    const request = new NextRequest("https://helvety.com/auth/login", {
      headers: { cookie: "csrf_token=not-a-valid-signed-cookie" },
    });

    const response = await proxy(request);

    expect(response.cookies.get("csrf_token")?.value).toBeDefined();
    expect(response.cookies.get("csrf_token")?.value).not.toBe(
      "not-a-valid-signed-cookie"
    );
  });

  it("skips bootstrap when the CSRF cookie is valid for the current signing secret", async () => {
    const token = "a".repeat(64);
    const signed = await signCookiePayload(token);
    const proxy = createSecurityProxy();
    const request = new NextRequest("https://helvety.com/auth/login", {
      headers: { cookie: `csrf_token=${signed}` },
    });

    const response = await proxy(request);

    expect(response.cookies.get("csrf_token")).toBeUndefined();
  });
});
