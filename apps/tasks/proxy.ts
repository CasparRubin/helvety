import { createSecurityProxy } from "@helvety/shared/proxy";
import { NextResponse, type NextRequest } from "next/server";

const securityProxy = createSecurityProxy({
  buildCspOptions: { imgBlob: true },
});

/** Resolve the canonical tasks root URL for redirects. */
function getTasksRoot(request: NextRequest): URL {
  const basePath = request.nextUrl.basePath || "/tasks";
  return new URL(basePath, request.url);
}

const LEGACY_TASKS_PATH_REGEX =
  /^\/(?:tasks\/)?(?:units|spaces|items)(?:\/.*)?$/;

/** Redirect legacy hierarchy paths, then apply shared security proxy. */
export async function proxy(request: NextRequest) {
  if (LEGACY_TASKS_PATH_REGEX.test(request.nextUrl.pathname)) {
    return NextResponse.redirect(getTasksRoot(request));
  }
  return securityProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};
