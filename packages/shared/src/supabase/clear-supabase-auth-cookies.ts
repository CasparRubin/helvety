import { COOKIE_DOMAIN } from "../config";

import type { NextRequest, NextResponse } from "next/server";

/** Clears `sb-*` auth session cookies on the outgoing response. */
export function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
): void {
  const baseOptions = {
    path: "/",
    maxAge: 0,
    ...(process.env.NODE_ENV === "production" && COOKIE_DOMAIN
      ? { domain: COOKIE_DOMAIN }
      : {}),
  };

  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && name.includes("auth")) {
      response.cookies.set(name, "", baseOptions);
    }
  }
}
