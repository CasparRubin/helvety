import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  HELVETY_PATHNAME_HEADER_NAME,
  SECURITY_PROXY_MATCHER,
  SECURITY_PROXY_PROFILE_OPTIONS,
  createAppProxy,
  createSecurityProxy,
  redirectRootToBasePath,
} from "./proxy";

import type { NextRequest as NextRequestType } from "next/server";

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
    expect(SECURITY_PROXY_PROFILE_OPTIONS["public-tool"]).toMatchObject({
      includeHelvetyUrl: true,
      buildCspOptions: {
        imgBlob: true,
        scriptUnsafeEval: "dev-only",
        workerBlob: true,
      },
    });
    expect(SECURITY_PROXY_PROFILE_OPTIONS["public-marketing"]).toMatchObject({
      includeHelvetyUrl: false,
    });
    expect(
      SECURITY_PROXY_PROFILE_OPTIONS["public-marketing"].includeRequestPathname
    ).toBeUndefined();
    expect(SECURITY_PROXY_PROFILE_OPTIONS["store-gateway"]).toMatchObject({
      includeHelvetyUrl: true,
    });
  });

  it("redirectRootToBasePath redirects root and skips non-root", () => {
    const rootRequest = makeRequest("https://helvety.com/", "/", "/pdf");
    const childRequest = makeRequest(
      "https://helvety.com/pdf/foo",
      "/pdf/foo",
      "/pdf"
    );

    const rootResult = redirectRootToBasePath(rootRequest, "/pdf");
    const childResult = redirectRootToBasePath(childRequest, "/pdf");

    expect(rootResult?.headers.get("location")).toBe("https://helvety.com/pdf");
    expect(childResult).toBeNull();
  });

  it("builds CSP report-uri from request nextUrl.basePath for zoned apps", async () => {
    const proxy = createSecurityProxy();
    const request = makeRequest(
      "https://helvety.com/pdf/foo",
      "/pdf/foo",
      "/pdf"
    );

    const response = await proxy(request);
    const csp = response.headers.get("Content-Security-Policy");

    expect(csp).toContain("report-uri /pdf/api/csp-report");
  });

  it("createAppProxy redirects root to basePath without calling security proxy", async () => {
    const securityProxy = vi.fn(async () =>
      NextResponse.redirect("https://helvety.com/security")
    );
    const proxy = createAppProxy({
      securityProxy,
      defaultBasePath: "/pdf",
    });

    const rootResponse = await proxy(makeRequest("https://helvety.com/", "/"));
    const normalResponse = await proxy(
      makeRequest("https://helvety.com/pdf/foo", "/pdf/foo")
    );

    expect(rootResponse.headers.get("location")).toBe(
      "https://helvety.com/pdf"
    );
    expect(normalResponse.headers.get("location")).toBe(
      "https://helvety.com/security"
    );
    expect(securityProxy).toHaveBeenCalledTimes(1);
  });
});

describe("createSecurityProxy pathname header", () => {
  it("forwards x-helvety-pathname when includeRequestPathname is enabled", async () => {
    const nextSpy = vi.spyOn(NextResponse, "next");
    const proxy = createSecurityProxy({
      includeRequestPathname: true,
    });
    const request = new NextRequest("https://helvety.com/privacy");

    await proxy(request);

    const forwardedHeaders = nextSpy.mock.calls[0]?.[0]?.request?.headers;
    expect(forwardedHeaders?.get(HELVETY_PATHNAME_HEADER_NAME)).toBe(
      "/privacy"
    );

    nextSpy.mockRestore();
  });

  it("does not forward x-helvety-pathname by default", async () => {
    const nextSpy = vi.spyOn(NextResponse, "next");
    const proxy = createSecurityProxy();
    const request = new NextRequest("https://helvety.com/privacy");

    await proxy(request);

    const forwardedHeaders = nextSpy.mock.calls[0]?.[0]?.request?.headers;
    expect(forwardedHeaders?.get(HELVETY_PATHNAME_HEADER_NAME)).toBeNull();

    nextSpy.mockRestore();
  });
});
