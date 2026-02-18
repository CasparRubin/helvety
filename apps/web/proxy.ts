import { randomBytes } from "crypto";

import { buildCsp } from "@helvety/config/next-headers";
import { COOKIE_DOMAIN } from "@helvety/shared/config";
import { getSupabaseKey, getSupabaseUrl } from "@helvety/shared/env-validation";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CSP_NONCE_LENGTH = 16;

/**
 * Proxy to refresh Supabase auth sessions on every request.
 *
 * This ensures:
 * 1. Sessions are refreshed before they expire
 * 2. Cookies are properly set with the correct domain for session sharing
 * 3. Server components always have access to fresh session data
 *
 * IMPORTANT: Per CVE-2025-29927, this proxy should ONLY handle session refresh,
 * NOT route protection. Use Server Layout Guards for authentication checks.
 */
export async function proxy(request: NextRequest) {
  const nonce = randomBytes(CSP_NONCE_LENGTH).toString("base64");
  const csp = buildCsp({ nonce });
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({ request });

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    supabaseUrl = getSupabaseUrl();
    supabaseKey = getSupabaseKey();
  } catch {
    supabaseResponse.headers.set("Content-Security-Policy", csp);
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

        // Set cookies on the response with proper domain for session sharing
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = {
            ...options,
            // In production, use COOKIE_DOMAIN constant for session sharing (same-origin under helvety.com)
            ...(process.env.NODE_ENV === "production" && {
              domain: COOKIE_DOMAIN,
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
  // Wrapped in try/catch so transient network failures (VPN, Private Relay,
  // DNS hiccups) don't crash the entire request. If refresh fails, server
  // components will handle auth independently via getUser().
  try {
    await supabase.auth.getClaims();
  } catch {
    // Session refresh failed - continue without refresh.
    // The request still proceeds; server components will re-check auth.
  }

  supabaseResponse.headers.set("Content-Security-Policy", csp);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Sub-app routes (each has its own proxy.ts with its own CSP nonce)
     * - Static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|store|pdf|tasks|contacts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
