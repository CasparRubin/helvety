import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("./client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("./rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("next/server", () => ({
  after: (cb: () => void) => cb(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

import { createCspReportHandler } from "./csp-report";

describe("createCspReportHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
  });

  it("rejects oversized request payloads with 413", async () => {
    const handler = createCspReportHandler("web");
    const oversized = "a".repeat(11 * 1024);

    const response = await handler(
      new Request("https://helvety.com/api/csp-report", {
        method: "POST",
        body: oversized,
      })
    );

    expect(response.status).toBe(413);
  });

  it("logs sanitized report fields without query strings", async () => {
    const handler = createCspReportHandler("web");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await handler(
      new Request("https://helvety.com/api/csp-report", {
        method: "POST",
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "https://helvety.com/app?token=abc123",
            "blocked-uri": "https://cdn.example.com/script.js?sig=xyz",
            "violated-directive": "script-src-elem",
          },
        }),
      })
    );

    expect(response.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledWith("[csp-report] web", {
      documentUri: "https://helvety.com/app",
      blockedUri: "https://cdn.example.com/script.js",
      violatedDirective: "script-src-elem",
      effectiveDirective: undefined,
      disposition: undefined,
      statusCode: undefined,
    });
  });

  it("returns 204 and parseError marker for invalid JSON payloads", async () => {
    const handler = createCspReportHandler("web");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await handler(
      new Request("https://helvety.com/api/csp-report", {
        method: "POST",
        body: "{not valid json",
      })
    );

    expect(response.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledWith("[csp-report] web", {
      parseError: true,
    });
  });
});
