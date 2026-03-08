import { createSecurityProxy } from "@helvety/shared/proxy";
import { NextResponse, type NextRequest } from "next/server";

const securityProxy = createSecurityProxy();

/** Resolve the canonical contacts root URL for redirects. */
function getContactsRoot(request: NextRequest): URL {
  const basePath = request.nextUrl.basePath || "/contacts";
  return new URL(basePath, request.url);
}

const LEGACY_CONTACT_DETAIL_REGEX =
  /^\/(?:contacts\/)?(?:contacts\/)?[0-9a-fA-F-]{8,}(?:\/.*)?$/;

/** Redirect legacy detail routes, then apply shared security proxy. */
export async function proxy(request: NextRequest) {
  if (LEGACY_CONTACT_DETAIL_REGEX.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(getContactsRoot(request));
  }
  return securityProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};
