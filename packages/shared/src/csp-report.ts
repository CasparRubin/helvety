import { NextResponse } from "next/server";

import { checkRateLimit } from "./rate-limit";

/** Max body size for CSP reports (10 KB) */
const CSP_REPORT_MAX_BYTES = 10 * 1024;

/** CSP report rate limit: 30 reports per minute per IP */
const CSP_REPORT_RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 1000 };

/**
 * Creates a CSP report handler for a specific app.
 *
 * Accepts CSP violation reports emitted by browser enforcement/report-only mode.
 *
 * NOTE: Uses console.warn/error directly instead of the logger utility because:
 * - logger.warn() is suppressed in production; CSP reports must be visible in prod
 * - logger.error() sanitizes payloads; browser CSP reports contain no user secrets
 *   and need full detail for debugging policy violations
 *
 * @param appName - The name of the app (used in log prefix)
 * @returns A POST handler function for the CSP report route
 */
export function createCspReportHandler(appName: string) {
  return async function POST(request: Request) {
    try {
      const contentLength = parseInt(
        request.headers.get("content-length") ?? "0",
        10
      );
      if (contentLength > CSP_REPORT_MAX_BYTES) {
        return new Response(null, { status: 413 });
      }

      const ip = request.headers.get("x-real-ip") ?? "unknown";
      const rateLimit = await checkRateLimit(
        `csp_report:ip:${ip}`,
        CSP_REPORT_RATE_LIMIT.maxRequests,
        CSP_REPORT_RATE_LIMIT.windowMs,
        "csp"
      );
      if (!rateLimit.allowed) {
        return new Response(null, { status: 429 });
      }

      const payload = await request.json().catch(() => null);
      console.warn(`[csp-report] ${appName}`, payload);
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("[csp-report] failed to process report", error);
      return NextResponse.json({ received: false }, { status: 400 });
    }
  };
}
