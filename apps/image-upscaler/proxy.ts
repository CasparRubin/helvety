import { createSecurityProxy } from "@helvety/shared/proxy";
import { NextResponse, type NextRequest } from "next/server";

const securityProxy = createSecurityProxy({
  buildCspOptions: {
    imgBlob: true,
    scriptUnsafeEval: "dev-only",
    workerBlob: true,
  },
});

/** Redirect direct-domain root requests to the app base path. */
function redirectRootToImageUpscalerBasePath(
  request: NextRequest
): NextResponse | null {
  const incomingPathname = new URL(request.url).pathname;
  if (incomingPathname !== "/") {
    return null;
  }

  const basePath = request.nextUrl.basePath || "/image-upscaler";
  return NextResponse.redirect(new URL(basePath, request.url));
}

/** Redirect direct-domain root requests before applying shared security middleware. */
export async function proxy(request: NextRequest) {
  const rootRedirect = redirectRootToImageUpscalerBasePath(request);
  if (rootRedirect) {
    return rootRedirect;
  }
  return securityProxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml|map|woff2?)$).*)",
  ],
};
