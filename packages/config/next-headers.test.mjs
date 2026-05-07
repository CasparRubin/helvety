import { describe, expect, it } from "vitest";

import { buildCsp, createSecurityHeaders } from "./next-headers.mjs";

function getDirective(csp, directiveName) {
  return (
    csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${directiveName} `)) ?? ""
  );
}

describe("createSecurityHeaders", () => {
  it("omits COEP in production while keeping COOP", async () => {
    process.env.NODE_ENV = "production";

    const headersFactory = createSecurityHeaders({ appName: "web" });
    const config = await headersFactory();
    const headers = config[0]?.headers ?? [];

    expect(headers).toEqual(
      expect.arrayContaining([
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ])
    );
    expect(headers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Cross-Origin-Embedder-Policy" }),
      ])
    );
  });

  it("keeps production-only transport headers out of development", async () => {
    process.env.NODE_ENV = "development";

    const headersFactory = createSecurityHeaders({ appName: "web" });
    const config = await headersFactory();
    const headers = config[0]?.headers ?? [];

    expect(headers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Strict-Transport-Security" }),
        expect.objectContaining({ key: "Cross-Origin-Opener-Policy" }),
      ])
    );
  });
});

describe("buildCsp", () => {
  it("adds nonce and omits unsafe-eval in production by default", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project-id.supabase.co";
    const csp = buildCsp({ nonce: "nonce-123" });

    expect(csp).toContain(
      "script-src 'self' 'nonce-nonce-123' 'strict-dynamic'"
    );
    const scriptDirective = getDirective(csp, "script-src");
    expect(scriptDirective).not.toContain("'unsafe-eval'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(csp).toContain(
      "connect-src 'self' https://va.vercel-scripts.com https://project-id.supabase.co wss://project-id.supabase.co"
    );
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("enables blob directives when requested", () => {
    process.env.NODE_ENV = "development";
    const csp = buildCsp({ imgBlob: true, workerBlob: true });

    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain(" blob:");
    expect(csp).toContain("worker-src 'self' blob:");
  });
});
