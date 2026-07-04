import { HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS } from "@helvety/shared/analytics-guardrails";
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
    Awaited<ReturnType<NonNullable<typeof nextConfig.rewrites>>> | undefined
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

  it("does not include legacy Vercel analytics gateway rewrite rules", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult) ?? [];

    for (const marker of HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS) {
      expect(
        beforeFiles.some((rule) => rule.source.includes(marker)),
        `rewrite source must not include ${marker}`
      ).toBe(false);
    }
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

  it("forwards tasks routes and tasks static assets to the tasks zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const tasksOrigin = `http://localhost:${DEV_PORTS.tasks}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/tasks", destination: `${tasksOrigin}/tasks` },
        { source: "/tasks/:path*", destination: `${tasksOrigin}/tasks/:path*` },
        {
          source: "/tasks-static/:path*",
          destination: `${tasksOrigin}/tasks-static/:path*`,
        },
      ])
    );
  });

  it("forwards contacts routes and contacts static assets to the contacts zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const contactsOrigin = `http://localhost:${DEV_PORTS.contacts}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/contacts", destination: `${contactsOrigin}/contacts` },
        {
          source: "/contacts/:path*",
          destination: `${contactsOrigin}/contacts/:path*`,
        },
        {
          source: "/contacts-static/:path*",
          destination: `${contactsOrigin}/contacts-static/:path*`,
        },
      ])
    );
  });

  it("forwards store routes to the store zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const storeOrigin = `http://localhost:${DEV_PORTS.store}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/store", destination: `${storeOrigin}/store` },
        { source: "/store/:path*", destination: `${storeOrigin}/store/:path*` },
      ])
    );
  });

  it("forwards pdf routes to the pdf zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const pdfOrigin = `http://localhost:${DEV_PORTS.pdf}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        { source: "/pdf", destination: `${pdfOrigin}/pdf` },
        { source: "/pdf/:path*", destination: `${pdfOrigin}/pdf/:path*` },
      ])
    );
  });

  it("forwards image-upscaler routes to the image-upscaler zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const imageUpscalerOrigin = `http://localhost:${DEV_PORTS.imageUpscaler}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/image-upscaler",
          destination: `${imageUpscalerOrigin}/image-upscaler`,
        },
        {
          source: "/image-upscaler/:path*",
          destination: `${imageUpscalerOrigin}/image-upscaler/:path*`,
        },
      ])
    );
  });

  it("forwards image-editor routes to the image-editor zone", async () => {
    const rewritesResult = await nextConfig.rewrites?.();
    const beforeFiles = getBeforeFiles(rewritesResult);
    const imageEditorOrigin = `http://localhost:${DEV_PORTS.imageEditor}`;

    expect(beforeFiles).toEqual(
      expect.arrayContaining([
        {
          source: "/image-editor",
          destination: `${imageEditorOrigin}/image-editor`,
        },
        {
          source: "/image-editor/:path*",
          destination: `${imageEditorOrigin}/image-editor/:path*`,
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
    vi.stubEnv("IMAGE_UPSCALER_URL", "");
    vi.stubEnv("IMAGE_EDITOR_URL", "");

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
