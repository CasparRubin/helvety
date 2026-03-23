import { DEV_PORTS } from "@helvety/shared/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

/** Shape of individual rewrite entries used in assertions. */
type RewriteRule = {
  source: string;
  destination: string;
};

/** Extracts beforeFiles rewrites regardless of Next.js return shape. */
function getBeforeFiles(
  rewritesResult:
    | Awaited<ReturnType<NonNullable<typeof nextConfig.rewrites>>>
    | undefined
): RewriteRule[] | undefined {
  if (!rewritesResult || Array.isArray(rewritesResult)) {
    return undefined;
  }

  return rewritesResult.beforeFiles as RewriteRule[] | undefined;
}

describe("web gateway rewrites", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("forwards auth routes and auth static assets to the auth zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const authOrigin = `http://localhost:${DEV_PORTS.auth}`;

    expect(beforeFiles).toBeDefined();

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/auth",
          destination: `${authOrigin}/auth`,
        },
        {
          source: "/auth/:path*",
          destination: `${authOrigin}/auth/:path*`,
        },
        {
          source: "/auth-static/:path*",
          destination: `${authOrigin}/auth-static/:path*`,
        },
      ])
    );
  });

  it("keeps localhost auth routing in development even when AUTH_URL is set", async () => {
    vi.stubEnv("AUTH_URL", "https://helvety-auth.vercel.app");
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/auth/:path*",
          destination: `http://localhost:${DEV_PORTS.auth}/auth/:path*`,
        },
      ])
    );
  });

  it("forwards notes routes and notes static assets to the notes zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const notesOrigin = `http://localhost:${DEV_PORTS.notes}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/notes", destination: `${notesOrigin}/notes` },
        { source: "/notes/:path*", destination: `${notesOrigin}/notes/:path*` },
        {
          source: "/notes-static/:path*",
          destination: `${notesOrigin}/notes-static/:path*`,
        },
      ])
    );
  });
});
