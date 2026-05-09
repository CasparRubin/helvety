import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  SECURITY_PROXY_MATCHER,
  SECURITY_PROXY_PROFILE_OPTIONS,
  createAppProxy,
  redirectRootToBasePath,
} from "./proxy";

import type { NextRequest } from "next/server";

/** Creates a minimal request-shaped object for proxy utility tests. */
function makeRequest(
  url: string,
  pathname: string,
  basePath = ""
): NextRequest {
  return {
    url,
    nextUrl: {
      pathname,
      basePath,
    },
  } as unknown as NextRequest;
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

  it("createAppProxy applies root redirect before security proxy", async () => {
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
