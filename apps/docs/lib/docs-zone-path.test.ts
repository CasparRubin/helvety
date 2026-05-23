import { getLoginUrl } from "@helvety/shared/auth-redirect";
import { describe, expect, it } from "vitest";

import {
  buildDocsPublicPath,
  DOCS_BASE_PATH,
  getDocsApiPath,
} from "./docs-zone-path";

describe("DOCS_BASE_PATH", () => {
  it("matches next.config basePath", () => {
    expect(DOCS_BASE_PATH).toBe("/docs");
  });
});

describe("buildDocsPublicPath", () => {
  it("maps zone root pathname to /docs", () => {
    expect(buildDocsPublicPath("/")).toBe("/docs");
  });

  it("preserves query for deep links", () => {
    expect(buildDocsPublicPath("/", "doc=abc-123")).toBe("/docs?doc=abc-123");
  });

  it("prefixes non-root pathnames", () => {
    expect(buildDocsPublicPath("/settings", "tab=vault")).toBe(
      "/docs/settings?tab=vault"
    );
  });
});

describe("getDocsApiPath", () => {
  it("prefixes API routes for browser fetch", () => {
    expect(getDocsApiPath("/api/docs")).toBe("/docs/api/docs");
    expect(
      getDocsApiPath("/api/docs/550e8400-e29b-41d4-a716-446655440000")
    ).toBe("/docs/api/docs/550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects paths without a leading slash", () => {
    expect(() => getDocsApiPath("api/docs")).toThrow(
      "Docs API path must start with /"
    );
  });
});

describe("buildDocsPublicPath + getLoginUrl", () => {
  it("produces gateway-visible vault sign-in return URLs", () => {
    const loginUrl = getLoginUrl(
      buildDocsPublicPath("/", "doc=550e8400-e29b-41d4-a716-446655440000"),
      { currentOrigin: "http://localhost:3001" }
    );

    expect(loginUrl).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fdocs%3Fdoc%3D550e8400-e29b-41d4-a716-446655440000"
    );
    expect(loginUrl).not.toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3001%2F%3Fdoc%3D"
    );
  });
});
