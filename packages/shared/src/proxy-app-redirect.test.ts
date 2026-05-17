import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAppProxy } from "./proxy";
import { AUTH_REFRESHED_HEADER_NAME } from "./supabase/refresh-auth-session-in-proxy";

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

describe("createAppProxy root redirect auth refresh", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("refreshes auth cookies on root redirect when session cookies are present", async () => {
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

    const securityProxy = vi.fn(async () => NextResponse.next());
    const proxy = createAppProxy({
      securityProxy,
      defaultBasePath: "/store",
    });

    const request = new NextRequest("https://helvety.com/", {
      headers: { cookie: "sb-example-auth-token=stale" },
    });

    const response = await proxy(request);

    expect(response.headers.get("location")).toBe("https://helvety.com/store");
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "updated"
    );
    expect(request.headers.get(AUTH_REFRESHED_HEADER_NAME)).toBe("1");
    expect(securityProxy).not.toHaveBeenCalled();
  });

  it("skips auth refresh on root redirect when there are no session cookies", async () => {
    const securityProxy = vi.fn(async () => NextResponse.next());
    const proxy = createAppProxy({
      securityProxy,
      defaultBasePath: "/store",
    });

    const request = new NextRequest("https://helvety.com/");
    const response = await proxy(request);

    expect(response.headers.get("location")).toBe("https://helvety.com/store");
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(securityProxy).not.toHaveBeenCalled();
  });
});
