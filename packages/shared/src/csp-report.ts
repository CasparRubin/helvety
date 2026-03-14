import { after, NextResponse } from "next/server";

import { getTrustedClientIp } from "./client-ip";
import { checkRateLimit } from "./rate-limit";

/** Max body size for CSP reports (10 KB) */
const CSP_REPORT_MAX_BYTES = 10 * 1024;

/** CSP report rate limit: 30 reports per minute per IP */
const CSP_REPORT_RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 1000 };

/** Whitelisted and sanitized CSP payload fields for logging. */
type CspLogPayload = {
  documentUri?: string;
  blockedUri?: string;
  violatedDirective?: string;
  effectiveDirective?: string;
  disposition?: string;
  statusCode?: number;
};

/**
 * Reads a request body with an explicit byte cap to avoid large payload parsing.
 */
async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<string | null> {
  if (!request.body) {
    return null;
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

/** Normalize/trim a URI field before logging CSP diagnostics. */
function sanitizeUri(raw: unknown): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }

  try {
    const parsed = new URL(raw);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return raw.slice(0, 256);
  }
}

/** Normalize/trim directive-like CSP fields before logging. */
function sanitizeDirective(raw: unknown): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }
  return raw.slice(0, 120);
}

/** Extract and sanitize a report payload into safe log fields. */
function getSanitizedCspPayload(payload: unknown): CspLogPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source =
    "csp-report" in payload &&
    payload["csp-report"] &&
    typeof payload["csp-report"] === "object"
      ? payload["csp-report"]
      : payload;
  if (!source || typeof source !== "object") {
    return null;
  }

  const sourceRecord = source as Record<string, unknown>;
  const statusCode =
    typeof sourceRecord["status-code"] === "number"
      ? sourceRecord["status-code"]
      : typeof sourceRecord["status_code"] === "number"
        ? sourceRecord["status_code"]
        : undefined;

  return {
    documentUri: sanitizeUri(sourceRecord["document-uri"]),
    blockedUri: sanitizeUri(sourceRecord["blocked-uri"]),
    violatedDirective: sanitizeDirective(sourceRecord["violated-directive"]),
    effectiveDirective: sanitizeDirective(sourceRecord["effective-directive"]),
    disposition: sanitizeDirective(sourceRecord.disposition),
    statusCode,
  };
}

/**
 * Creates a CSP report handler for a specific app.
 *
 * Accepts CSP violation reports emitted by browser enforcement/report-only mode.
 *
 * NOTE: Uses console.warn/error directly instead of the logger utility because:
 * - CSP report payloads are operational diagnostics and are easier to inspect as raw output
 * - The shared logger may apply formatting/sanitization that is less useful for CSP debugging
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

      const ip =
        getTrustedClientIp(request.headers, {
          requireTrustedProxyInProduction: true,
        }) ?? "unknown";
      const rateLimit = await checkRateLimit(
        `csp_report:ip:${ip}`,
        CSP_REPORT_RATE_LIMIT.maxRequests,
        CSP_REPORT_RATE_LIMIT.windowMs,
        "csp",
        "soft"
      );
      if (!rateLimit.allowed) {
        return new Response(null, { status: 429 });
      }

      const body = await readBodyWithLimit(request, CSP_REPORT_MAX_BYTES);
      if (body === null) {
        return new Response(null, { status: 413 });
      }

      const payload = (() => {
        try {
          return JSON.parse(body) as unknown;
        } catch {
          return null;
        }
      })();
      const sanitizedPayload = getSanitizedCspPayload(payload);
      after(() => {
        if (!sanitizedPayload) {
          console.warn(`[csp-report] ${appName}`, { parseError: true });
          return;
        }
        console.warn(`[csp-report] ${appName}`, sanitizedPayload);
      });
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("[csp-report] failed to process report", error);
      return NextResponse.json({ received: false }, { status: 400 });
    }
  };
}
