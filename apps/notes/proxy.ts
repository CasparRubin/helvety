import { createSecurityProxy } from "@helvety/shared/proxy";
import { NextResponse, type NextRequest } from "next/server";

const securityProxy = createSecurityProxy({
  buildCspOptions: { imgBlob: true },
});

/** Resolve the canonical notes root URL for redirects. */
function getNotesRoot(request: NextRequest): URL {
  const basePath = request.nextUrl.basePath || "/notes";
  return new URL(basePath, request.url);
}

const LEGACY_NOTES_PATH_REGEX =
  /^\/(?:notes\/)?(?:units|spaces|items)(?:\/.*)?$/;

/** Redirect deprecated legacy note paths, then apply shared security proxy. */
export async function proxy(request: NextRequest) {
  if (LEGACY_NOTES_PATH_REGEX.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(getNotesRoot(request));
  }
  return securityProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};
