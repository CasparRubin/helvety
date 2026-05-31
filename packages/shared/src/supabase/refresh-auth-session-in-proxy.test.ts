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

/** Mocks createServerClient with a custom `auth.getClaims` implementation. */
function mockAuthWithGetClaims(
  getClaims: () => Promise<{ error: unknown }>
): void {
  createServerClientMock.mockImplementation(() => ({
    auth: { getClaims },
  }));
}

describe("refreshSupabaseAuthSession", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("propagates refreshed cookies to request and response", async () => {
    createServerClientMock.mockImplementation((_url, _key, options) => ({
      auth: {
        getClaims: async () => {
          options.cookies.setAll([
            {
              name: "sb-example-auth-token",
              value: "updated",
              options: { path: "/", httpOnly: true },
            },
          ]);
          return { error: null };
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
        getClaims: async () => {
          options.cookies.setAll([
            {
              name: "sb-example-auth-token",
              value: "updated",
              options: { path: "/", httpOnly: true },
            },
          ]);
          return { error: null };
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
    mockAuthWithGetClaims(async () => {
      throw new Error("refresh failed");
    });

    const request = new NextRequest("https://helvety.com/tasks");
    const baseResponse = NextResponse.next({ request });

    const response = await refreshSupabaseAuthSession(request, baseResponse);
    expect(response).toBe(baseResponse);
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });

  it("clears sb-* cookies on refresh_token_not_found without fail-closed", async () => {
    mockAuthWithGetClaims(async () => ({
      error: {
        message: "Invalid Refresh Token: Refresh Token Not Found",
        status: 400,
        code: "refresh_token_not_found",
        name: "AuthApiError",
      },
    }));

    const request = new NextRequest("https://helvety.com/", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const baseResponse = NextResponse.next({ request });

    const response = await refreshSupabaseAuthSession(request, baseResponse);

    expect(response.cookies.get("sb-example-auth-token")?.value).toBe("");
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });

  it("clears sb-* cookies on definitive auth failure when fail-closed", async () => {
    mockAuthWithGetClaims(async () => ({
      error: {
        message: "session is invalid",
        status: 401,
        name: "AuthError",
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

  it("verifies session with getClaims at the proxy edge", async () => {
    const getClaims = vi.fn(async () => ({ error: null }));
    createServerClientMock.mockImplementation(() => ({
      auth: { getClaims },
    }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    await refreshSupabaseAuthSession(request, NextResponse.next({ request }));

    expect(getClaims).toHaveBeenCalled();
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
  });

  it("does not set auth-refreshed header when verify succeeds without writing cookies", async () => {
    mockAuthWithGetClaims(async () => ({ error: null }));

    const request = new NextRequest("https://helvety.com/tasks", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });
    const baseResponse = NextResponse.next({ request });

    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();

    await refreshSupabaseAuthSession(request, baseResponse);

    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBeNull();
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
