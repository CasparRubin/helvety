import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetCookieSigningKeyCache } from "./cookie-signing";
import { createSecurityProxy } from "./proxy";
import { AUTH_REFRESHED_HEADER_NAME } from "./supabase/refresh-auth-session-in-proxy";

const ORIGINAL_ENV = { ...process.env };

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("./env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "anon-key",
}));

describe("createSecurityProxy Supabase auth refresh", () => {
  beforeEach(() => {
    process.env.HELVETY_COOKIE_SIGNING_SECRET =
      "test_cookie_signing_secret_for_proxy_csrf_tests_12";
    createServerClientMock.mockReset();
    resetCookieSigningKeyCache();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetCookieSigningKeyCache();
    vi.restoreAllMocks();
  });

  it("does not forward x-helvety-auth-refreshed when verify succeeds without cookie writes", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    }));

    const nextSpy = vi.spyOn(NextResponse, "next");
    const proxy = createSecurityProxy({ includeCsrf: false });
    const request = new NextRequest("https://helvety.com/store/products", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });

    await proxy(request);

    const forwardedHeaders = nextSpy.mock.calls.at(-1)?.[0]?.request?.headers;
    expect(forwardedHeaders?.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();

    nextSpy.mockRestore();
  });

  it("forwards refreshed auth cookies and the auth-refreshed header together", async () => {
    createServerClientMock.mockImplementation((_url, _key, options) => ({
      auth: {
        getUser: async () => {
          options.cookies.setAll([
            {
              name: "sb-example-auth-token",
              value: "updated",
              options: { path: "/", httpOnly: true },
            },
          ]);
          return { data: { user: null }, error: null };
        },
      },
    }));

    const proxy = createSecurityProxy({ includeCsrf: false });
    const request = new NextRequest("https://helvety.com/store/products", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });

    const response = await proxy(request);

    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "updated"
    );
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });

  it("skips Supabase client creation when there are no auth session cookies", async () => {
    const proxy = createSecurityProxy({ includeCsrf: false });
    const request = new NextRequest("https://helvety.com/store/products");

    await proxy(request);

    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });
});
