import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseKey, getSupabaseUrl } from "@/lib/env-validation";

// =============================================================================
// Nonce-based CSP
// =============================================================================

/**
 * Build the Content-Security-Policy header with a per-request nonce.
 *
 * Using a nonce instead of 'unsafe-inline' for script-src prevents XSS attacks
 * from injecting arbitrary inline scripts. This is critical for the auth service
 * where any XSS means total compromise (session cookies, E2EE keys, passkey
 * ceremonies).
 *
 * 'strict-dynamic' allows scripts loaded by nonce-tagged scripts to execute,
 * so dynamically loaded chunks inherit trust without explicit host allowlisting.
 */
function buildCspHeader(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  const directives = [
    "default-src 'self'",
    // Nonce-based script-src: 'strict-dynamic' propagates trust to dynamically loaded scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    // Style-src: nonce for styles where possible; 'unsafe-inline' fallback for CSS-in-JS
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://va.vercel-scripts.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

// =============================================================================
// Proxy
// =============================================================================

/**
 * Proxy to refresh Supabase auth sessions and apply nonce-based CSP on every request.
 *
 * This ensures:
 * 1. Sessions are refreshed before they expire
 * 2. Cookies are properly set with the correct domain for cross-subdomain SSO
 * 3. Server components always have access to fresh session data
 * 4. A unique CSP nonce is generated per request, replacing 'unsafe-inline' in script-src
 *
 * IMPORTANT: Per CVE-2025-29927, this proxy should ONLY handle session refresh,
 * NOT route protection. Use Server Layout Guards for authentication checks.
 */
export async function proxy(request: NextRequest) {
  // Generate a unique nonce for this request (used in CSP script-src)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Set the nonce in request headers so server components can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    supabaseUrl = getSupabaseUrl();
    supabaseKey = getSupabaseKey();
  } catch {
    // Skip auth refresh if env vars are missing or invalid
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // First, set cookies on the request (for downstream server components)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        // Create a new response with the updated request
        supabaseResponse = NextResponse.next({ request });

        // Set cookies on the response with proper domain for cross-subdomain SSO
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = {
            ...options,
            // In production, use COOKIE_DOMAIN env for cross-subdomain session sharing (default: .helvety.com)
            ...(process.env.NODE_ENV === "production" && {
              domain: process.env.COOKIE_DOMAIN ?? ".helvety.com",
            }),
          };
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  // Validate JWT and refresh session only when needed (getClaims validates
  // locally; Auth API is called only on refresh). Avoids 429 rate limits
  // from calling getUser() on every request.
  //
  // Wrapped in try/catch so transient network failures (VPN, Private Relay,
  // DNS hiccups) don't crash the entire request. If refresh fails, server
  // components will handle auth independently via getUser().
  try {
    await supabase.auth.getClaims();
  } catch {
    // Session refresh failed - continue without refresh.
    // The request still proceeds; server components will re-check auth.
  }

  // Apply CSP header with the per-request nonce
  const csp = buildCspHeader(nonce);
  supabaseResponse.headers.set("Content-Security-Policy", csp);
  supabaseResponse.headers.set("x-nonce", nonce);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
