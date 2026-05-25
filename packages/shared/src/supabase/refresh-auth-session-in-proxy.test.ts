import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_REFRESHED_HEADER_NAME,
  refreshSupabaseAuthSession,
  requestMayHaveSupabaseAuthCookie,
} from "./refresh-auth-session-in-proxy";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("../env-validation", () => ({
  getSupabaseUrl: () => "https://example.supabase.co",
  getSupabaseKey: () => "anon-key",
}));

describe("refreshSupabaseAuthSession", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("propagates refreshed cookies to request and response", async () => {
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

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const baseResponse = NextResponse.next({ request });

    const response = await refreshSupabaseAuthSession(request, baseResponse);

    expect(request.cookies.get("sb-example-auth-token")?.value).toBe("updated");
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "updated"
    );
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });

  it("preserves redirect responses and refreshed cookies", async () => {
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

    const request = new NextRequest("https://helvety.com/", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const redirectResponse = NextResponse.redirect(
      new URL("/store", request.url)
    );

    const response = await refreshSupabaseAuthSession(
      request,
      redirectResponse
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://helvety.com/store");
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "updated"
    );
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });

  it("returns the original response when auth refresh fails", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => {
          throw new Error("refresh failed");
        },
      },
    }));

    const request = new NextRequest("https://helvety.com/tasks");
    const baseResponse = NextResponse.next({ request });

    const response = await refreshSupabaseAuthSession(request, baseResponse);
    expect(response).toBe(baseResponse);
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });

  it("clears sb-* cookies on definitive auth failure when fail-closed", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: {
            message: "session is invalid",
            status: 401,
            name: "AuthError",
          },
        }),
      },
    }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const baseResponse = NextResponse.next({ request });

    const response = await refreshSupabaseAuthSession(request, baseResponse, {
      failClosedOnAuthError: true,
    });

    expect(response.cookies.get("sb-example-auth-token")?.value).toBe("");
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });

  it("uses getClaims when available on the auth client", async () => {
    const getClaims = vi.fn(async () => ({ error: null }));
    const getUser = vi.fn();
    createServerClientMock.mockImplementation(() => ({
      auth: { getClaims, getUser },
    }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    await refreshSupabaseAuthSession(request, NextResponse.next({ request }));

    expect(getClaims).toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });

  it("falls back to getUser when getClaims is not available", async () => {
    const getUser = vi.fn(async () => ({ data: { user: null }, error: null }));
    createServerClientMock.mockImplementation(() => ({
      auth: { getUser },
    }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    await refreshSupabaseAuthSession(request, NextResponse.next({ request }));

    expect(getUser).toHaveBeenCalled();
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });

  it("sets the auth-refreshed header only after a successful session verify", async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const baseResponse = NextResponse.next({ request });

    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();

    await refreshSupabaseAuthSession(request, baseResponse);

    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
  });
});

describe("requestMayHaveSupabaseAuthCookie", () => {
  it("returns false when there are no cookies", () => {
    const request = new NextRequest("https://helvety.com/auth/login");
    expect(requestMayHaveSupabaseAuthCookie(request)).toBe(false);
  });

  it("returns false when cookies are unrelated to Supabase auth", () => {
    const request = new NextRequest("https://helvety.com/auth/login", {
      headers: { cookie: "csrf_token=abc; other=value" },
    });
    expect(requestMayHaveSupabaseAuthCookie(request)).toBe(false);
  });

  it("returns true when an sb-* auth session cookie is present", () => {
    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=eyJhbGciOiJIUzI1NiJ9" },
    });
    expect(requestMayHaveSupabaseAuthCookie(request)).toBe(true);
  });

  it("returns true for chunked Supabase auth cookie names", () => {
    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token.0=chunk" },
    });
    expect(requestMayHaveSupabaseAuthCookie(request)).toBe(true);
  });
});
