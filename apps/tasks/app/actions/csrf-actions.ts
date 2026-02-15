"use server";

import "server-only";

import { generateCSRFToken } from "@helvety/shared/csrf";

/**
 * Server Action to generate and return a CSRF token.
 * Server Actions can set cookies (unlike Server Components in Next.js 16+).
 *
 * @returns The generated CSRF token
 */
export async function fetchCSRFToken(): Promise<string> {
  return generateCSRFToken();
}
