import "server-only";

import { randomBytes, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";

import { COOKIE_DOMAIN } from "./config";

/**
 * CSRF Protection Module
 *
 * Provides Cross-Site Request Forgery protection for Server Actions.
 * Uses the double-submit cookie pattern with timing-safe comparison.
 *
 * Token lifecycle:
 * 1. The CSRF cookie is generated in proxy.ts on each request (if missing).
 *    This MUST happen in the proxy -- cookies().set() is NOT allowed in
 *    Server Components or layouts and will throw at runtime.
 * 2. The layout reads the token via getCSRFToken() and passes it to the
 *    CSRFProvider for client components.
 * 3. Server Actions validate the token with validateCSRFToken() /
 *    requireCSRFToken().
 */

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token and store it in an HttpOnly cookie.
 *
 * WARNING: This function calls cookies().set(), which is only allowed in
 * Server Actions, Route Handlers, and the proxy (proxy.ts). Do NOT call
 * this from Server Components or layouts -- it will throw at runtime.
 *
 * In practice, CSRF token generation is handled by proxy.ts. This function
 * is kept for use in Server Actions or Route Handlers if needed.
 *
 * @returns The generated CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    ...(process.env.NODE_ENV === "production" && { domain: COOKIE_DOMAIN }),
  });

  return token;
}

/**
 * Get the current CSRF token from cookies without generating a new one.
 *
 * @returns The current token or null if not set
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

/**
 * Validate a CSRF token against the stored cookie value.
 *
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param token - The token to validate (from form submission or header)
 * @returns true if the token is valid, false otherwise
 */
export async function validateCSRFToken(
  token: string | null | undefined
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const tokenBuffer = Buffer.from(token, "utf8");
    const cookieBuffer = Buffer.from(cookieToken, "utf8");

    // Buffers must be the same length for timingSafeEqual
    if (tokenBuffer.length !== cookieBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, cookieBuffer);
  } catch {
    return false;
  }
}

/**
 * Require a valid CSRF token or throw an error.
 *
 * Use this in Server Actions that modify state.
 *
 * @param token - The token to validate
 * @throws Error if the token is invalid
 */
export async function requireCSRFToken(
  token: string | null | undefined
): Promise<void> {
  const isValid = await validateCSRFToken(token);

  if (!isValid) {
    throw new Error("Invalid CSRF token");
  }
}
