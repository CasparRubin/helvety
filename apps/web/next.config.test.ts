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

  it("does not proxy Vercel analytics script rewrites", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult) ?? [];

    expect(
      beforeFiles.some((rule) => rule.source.includes("analyticsId"))
    ).toBe(false);
    expect(beforeFiles.some((rule) => rule.source.includes("script.js"))).toBe(
      false
    );
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

  it("forwards docs routes to the docs zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const docsOrigin = `http://localhost:${DEV_PORTS.docs}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/docs", destination: `${docsOrigin}/docs` },
        { source: "/docs/:path*", destination: `${docsOrigin}/docs/:path*` },
      ])
    );
  });

  it("keeps localhost docs routing in development even when DOCS_URL is set", async () => {
    vi.stubEnv("DOCS_URL", "https://helvety-docs.vercel.app");
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/docs/:path*",
          destination: `http://localhost:${DEV_PORTS.docs}/docs/:path*`,
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
    vi.stubEnv("DOCS_URL", "");
    vi.stubEnv("IMAGE_UPSCALER_URL", "");

    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const authOrigin = `http://localhost:${DEV_PORTS.auth}`;
    const docsOrigin = `http://localhost:${DEV_PORTS.docs}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/auth/:path*",
          destination: `${authOrigin}/auth/:path*`,
        },
        {
          source: "/docs/:path*",
          destination: `${docsOrigin}/docs/:path*`,
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

  it("requires DOCS_URL on Vercel production when unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("AUTH_URL", "https://helvety-auth.vercel.app");
    vi.stubEnv("TASKS_URL", "https://helvety-tasks.vercel.app");
    vi.stubEnv("CONTACTS_URL", "https://helvety-contacts.vercel.app");
    vi.stubEnv("NOTES_URL", "https://helvety-notes.vercel.app");
    vi.stubEnv("LINKS_URL", "https://helvety-links.vercel.app");
    vi.stubEnv("STORE_URL", "https://helvety-store.vercel.app");
    vi.stubEnv("PDF_URL", "https://helvety-pdf.vercel.app");
    vi.stubEnv(
      "IMAGE_UPSCALER_URL",
      "https://helvety-image-upscaler.vercel.app"
    );
    vi.stubEnv("DOCS_URL", "");

    await expect(nextConfig.rewrites?.()).rejects.toThrow(
      "DOCS_URL is required on Vercel in production."
    );
  });
});
