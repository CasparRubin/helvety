import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { requestMayHaveSupabaseAuthCookie } from "./refresh-auth-session-in-proxy";

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
