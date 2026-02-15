import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Accepts CSP violation reports emitted by browser enforcement/report-only mode.
 *
 * NOTE: Uses console.warn/error directly instead of the logger utility because:
 * - logger.warn() is suppressed in production; CSP reports must be visible in prod
 * - logger.error() sanitizes payloads; browser CSP reports contain no user secrets
 *   and need full detail for debugging policy violations
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    console.warn("[csp-report] helvety-pdf", payload);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[csp-report] failed to process report", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
