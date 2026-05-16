import { DEV_PORTS } from "@helvety/shared/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

/** Shape of individual rewrite entries used in assertions. */
type RewriteRule = {
  source: string;
  destination: string;
  has?: Array<{
    type: string;
    key?: string;
    value?: string;
  }>;
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

  return rewritesResult.beforeFiles;
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

    expect(Array.isArray(beforeFiles)).toBe(true);

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
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${authOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/auth(?:/.*)?$",
            },
          ],
        },
      ])
    );
  });

  it("routes analytics script requests to every zone origin by referer path", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const tasksOrigin = `http://localhost:${DEV_PORTS.tasks}`;
    const contactsOrigin = `http://localhost:${DEV_PORTS.contacts}`;
    const notesOrigin = `http://localhost:${DEV_PORTS.notes}`;
    const linksOrigin = `http://localhost:${DEV_PORTS.links}`;
    const storeOrigin = `http://localhost:${DEV_PORTS.store}`;
    const pdfOrigin = `http://localhost:${DEV_PORTS.pdf}`;
    const imageUpscalerOrigin = `http://localhost:${DEV_PORTS.imageUpscaler}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${tasksOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/tasks(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${contactsOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/contacts(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${notesOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/notes(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${linksOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/links(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${storeOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/store(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${pdfOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/pdf(?:/.*)?$",
            },
          ],
        },
        {
          source: "/:analyticsId([a-z0-9]+)/script.js",
          destination: `${imageUpscalerOrigin}/:analyticsId([a-z0-9]+)/script.js`,
          has: [
            {
              type: "header",
              key: "referer",
              value: ".*/image-upscaler(?:/.*)?$",
            },
          ],
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

  it("forwards links routes and links static assets to the links zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const linksOrigin = `http://localhost:${DEV_PORTS.links}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/links", destination: `${linksOrigin}/links` },
        { source: "/links/:path*", destination: `${linksOrigin}/links/:path*` },
        {
          source: "/links-static/:path*",
          destination: `${linksOrigin}/links-static/:path*`,
        },
      ])
    );
  });

  it("uses localhost rewrite targets in production when gateway env vars are unset and not on Vercel", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("TASKS_URL", "");
    vi.stubEnv("CONTACTS_URL", "");
    vi.stubEnv("NOTES_URL", "");
    vi.stubEnv("LINKS_URL", "");
    vi.stubEnv("STORE_URL", "");
    vi.stubEnv("PDF_URL", "");

    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const authOrigin = `http://localhost:${DEV_PORTS.auth}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/auth/:path*",
          destination: `${authOrigin}/auth/:path*`,
        },
      ])
    );
  });

  it("requires gateway env vars on Vercel production when unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("AUTH_URL", "");

    await expect(nextConfig.rewrites?.()).rejects.toThrow(
      "AUTH_URL is required on Vercel in production."
    );
  });
});
